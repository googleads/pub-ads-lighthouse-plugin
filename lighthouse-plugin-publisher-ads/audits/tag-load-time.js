// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const ComputedTagLoadTime = require('../computed/tag-load-time');
const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n');
const {auditNotApplicable, runWarning} = require('../messages/common-strings');
const {Audit} = require('lighthouse');

const UIStrings = {
  title: 'Tag load time',
  failureTitle: 'Reduce tag load time',
  description: 'This metric measures the time for the Google Publisher ' +
  'Tag\'s implementation script (pubads_impl.js) to load after the page ' +
  'loads. [Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/metrics' +
  ').',
  displayValue: '{timeInMs, number, seconds} s',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

// Point of diminishing returns.
const PODR = 1000; // ms
const MEDIAN = 2000; // ms

/**
 * Audit to determine time for tag to load relative to page start.
 */
class TagLoadTime extends Audit {
  /**
   * @return {LH.Audit.Meta}
   * @override
   */
  static get meta() {
    return {
      id: 'tag-load-time',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      // @ts-ignore
      scoreDisplayMode: Audit.SCORING_MODES.NUMERIC,
      requiredArtifacts: ['devtoolsLogs', 'traces'],
    };
  }
  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const metricData = {trace, devtoolsLog, settings: context.settings};

    const {timing} = await ComputedTagLoadTime.request(metricData, context);
    if (!(timing > 0)) { // Handle NaN, etc.
      context.LighthouseRunWarnings.push(runWarning.NoTag);
      return auditNotApplicable.NoTag;
    }

    // NOTE: score is relative to page response time to avoid counting time for
    // first party rendering.
    let normalScore = Audit.computeLogNormalScore(timing, PODR, MEDIAN);

    // Results that have green text should be under passing category.
    if (normalScore >= .9) {
      normalScore = 1;
    }

    return {
      numericValue: timing * 1e-3, // seconds
      score: normalScore,
      displayValue: str_(UIStrings.displayValue, {timeInMs: timing}),
    };
  }
}
module.exports = TagLoadTime;
module.exports.UIStrings = UIStrings;
