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

const array = require('../utils/array');
const {auditNotApplicable} = require('../utils/builder');
const {Audit} = require('lighthouse');
const {isBoxInViewport} = require('../utils/geometry');

/** @inheritDoc */
class AdsInViewport extends Audit {
  /**
   * @return {AuditMetadata}
   * @override
   */
  static get meta() {
    return {
      id: 'ads-in-viewport',
      title: 'Most ads loaded are within viewport',
      failureTitle: 'There are eager ads loaded outside viewport',
      description: 'Too many ads loaded outside the viewport lowers ' +
          'viewability rates and impact user experience, consider loading ' +
          'ads below the fold lazily as the user scrolls down. Consider ' +
          'using GPT\'s [Lazy Loading API]' +
          '(https://developers.google.com/doubleclick-gpt/reference' +
          '#googletag.PubAdsService_enableLazyLoad).',
      requiredArtifacts: ['ViewportDimensions', 'RenderedAdSlots'],
    };
  }

  /**
   * @param {Artifacts} artifacts
   * @return {LH.Audit.Product}
   */
  static audit(artifacts) {
    const viewport = artifacts.ViewportDimensions;
    const slots = artifacts.RenderedAdSlots;

    if (!slots.length) {
      return auditNotApplicable('No slots on page.');
    }
    // Checks that non-null (visible) slots exist in array.
    if (!slots.find((s) => s != null)) {
      return auditNotApplicable('No visible slots on page.');
    }

    // TODO(gmatute): account for scrolling, deep links, and reflows
    const viewed = array.count(slots, (slot) =>
      isBoxInViewport(slot, viewport));
    const unviewed = slots.length - viewed;

    return {
      rawValue: viewed / slots.length,
      score: unviewed > 3 ? 0 : 1,
      displayValue: unviewed ? `${unviewed} ads were out of view` : '',
    };
  }
}

module.exports = AdsInViewport;
