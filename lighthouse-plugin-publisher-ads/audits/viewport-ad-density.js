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

const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n');
const {auditNotApplicable, auditError} = require('../messages/common-strings');
const {Audit} = require('lighthouse');
const {boxViewableArea} = require('../utils/geometry');
const {isAdIframe} = require('../utils/resource-classification');

const UIStrings = {
  title: 'Ad density in the document is within recommended range',
  failureTitle: 'Reduce ad density in the document',
  description: 'The ads-to-content ratio inside the document can have an ' +
  'impact on user experience and ultimately user retention. The Better Ads ' +
  'Standard [recommends having an ad density below 30%]' +
  '(https://www.betterads.org/mobile-ad-density-higher-than-30/). ' +
  '[Learn more](' +
  'https://developers.google.com/publisher-ads-audits/reference/audits/viewport-ad-density' +
  ').',
  displayValue: '{adDensity, number, percent} ad density',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

/** @inheritDoc */
class ViewportAdDensity extends Audit {
  /**
   * @return {AuditMetadata}
   * @override
   */
  static get meta() {
    return {
      id: 'viewport-ad-density',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      requiredArtifacts: ['ViewportDimensions', 'IFrameElements'],
    };
  }

  /**
   * @override
   * @param {Artifacts} artifacts
   * @return {LH.Audit.Product}
   */
  static audit(artifacts) {
    const viewport = artifacts.ViewportDimensions;
    const slots = artifacts.IFrameElements.filter(
      (slot) => isAdIframe(slot) &&
      slot.clientRect.width * slot.clientRect.height > 1 );

    if (!slots.length) {
      return auditNotApplicable.NoVisibleSlots;
    }

    if (viewport.innerHeight <= 0) {
      throw new Error(auditError.ViewportAreaZero);
    }

    // We measure document length based on the bottom ad so that it isn't skewed
    // by lazy loading.
    const adsBottom =
      Math.max(...slots.map(s => s.clientRect.top + s.clientRect.height / 2));
    const documentLength = adsBottom + viewport.innerHeight;

    const adHeights =
      slots.map(s => s.clientRect.height).reduce((a, b) => a + b, 0);

    const adDensity = adHeights / documentLength;
    const score = adDensity > 0.3 ? 0 : 1;
    return {
      score,
      numericValue: adDensity,
      numericUnit: 'unitless',
      displayValue: str_(UIStrings.displayValue, {adDensity}),
    };
  }
}

module.exports = ViewportAdDensity;
module.exports.UIStrings = UIStrings;
