/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Hct} from '../hct/hct.js';
import {TonalPalette} from '../palettes/tonal_palette.js';
import * as math from '../utils/math_utils.js';
import {ContrastCurve} from './contrast_curve.js';
import {DynamicColor} from './dynamic_color';
import {ToneDeltaPair} from './tone_delta_pair.js';
import type {DynamicScheme} from "./dynamic_scheme";
import {ColorSpecDelegate} from "./color_spec";

/**
 * Returns the maximum tone for a given chroma in the palette.
 *
 * @param palette The tonal palette to use.
 * @param lowerBound The lower bound of the tone.
 * @param upperBound The upper bound of the tone.
 */
function tMaxC(
    palette: TonalPalette, lowerBound: number = 0, upperBound: number = 100,
    chromaMultiplier: number = 1): number {
    let answer = findBestToneForChroma(
        palette.hue, palette.chroma * chromaMultiplier, 100, true);
    return math.clampDouble(lowerBound, upperBound, answer);
}

/**
 * Returns the minimum tone for a given chroma in the palette.
 *
 * @param palette The tonal palette to use.
 * @param lowerBound The lower bound of the tone.
 * @param upperBound The upper bound of the tone.
 */
function tMinC(
    palette: TonalPalette, lowerBound: number = 0,
    upperBound: number = 100): number {
    let answer = findBestToneForChroma(palette.hue, palette.chroma, 0, false);
    return math.clampDouble(lowerBound, upperBound, answer);
}

/**
 * Searches for the best tone with a given chroma from a given tone at a
 * specific hue.
 *
 * @param hue The given hue.
 * @param chroma The target chroma.
 * @param tone The tone to start with.
 * @param byDecreasingTone Whether to search for lower tones.
 */
function findBestToneForChroma(
    hue: number, chroma: number, tone: number,
    byDecreasingTone: boolean): number {
    let answer = tone;
    let bestCandidate = Hct.from(hue, chroma, answer);
    while (bestCandidate.chroma < chroma) {
        if (tone < 0 || tone > 100) {
            break;
        }
        tone += byDecreasingTone ? -1.0 : 1.0;
        const newCandidate = Hct.from(hue, chroma, tone);
        if (bestCandidate.chroma < newCandidate.chroma) {
            bestCandidate = newCandidate;
            answer = tone;
        }
    }

    return answer;
}

/**
 * Returns the contrast curve for a given default contrast.
 *
 * @param defaultContrast The default contrast to use.
 */
function getCurve(defaultContrast: number): ContrastCurve {
    if (defaultContrast === 1.5) {
        return new ContrastCurve(1.5, 1.5, 3, 4.5);
    } else if (defaultContrast === 3) {
        return new ContrastCurve(3, 3, 4.5, 7);
    } else if (defaultContrast === 4.5) {
        return new ContrastCurve(4.5, 4.5, 7, 11);
    } else if (defaultContrast === 6) {
        return new ContrastCurve(6, 6, 7, 11);
    } else if (defaultContrast === 7) {
        return new ContrastCurve(7, 7, 11, 21);
    } else if (defaultContrast === 9) {
        return new ContrastCurve(9, 9, 11, 21);
    } else if (defaultContrast === 11) {
        return new ContrastCurve(11, 11, 21, 21);
    } else if (defaultContrast === 21) {
        return new ContrastCurve(21, 21, 21, 21);
    } else {
        // Shouldn't happen.
        return new ContrastCurve(defaultContrast, defaultContrast, 7, 21);
    }
}

/**
 * A delegate for the dynamic color spec of a DynamicScheme in the 2025 spec.
 */
export class ColorSpecDelegateImpl2025 implements ColorSpecDelegate {
    ////////////////////////////////////////////////////////////////
    // Main Palettes                                              //
    ////////////////////////////////////////////////////////////////

    primaryPaletteKeyColor(): DynamicColor {
        return DynamicColor.fromPalette({
            name: 'primary_palette_key_color',
            palette: (s) => s.primaryPalette,
            tone: (s) => s.primaryPalette.keyColor.tone,
        });
    }

    secondaryPaletteKeyColor(): DynamicColor {
        return DynamicColor.fromPalette({
            name: 'secondary_palette_key_color',
            palette: (s) => s.secondaryPalette,
            tone: (s) => s.secondaryPalette.keyColor.tone,
        });
    }

    tertiaryPaletteKeyColor(): DynamicColor {
        return DynamicColor.fromPalette({
            name: 'tertiary_palette_key_color',
            palette: (s) => s.tertiaryPalette,
            tone: (s) => s.tertiaryPalette.keyColor.tone,
        });
    }

    neutralPaletteKeyColor(): DynamicColor {
        return DynamicColor.fromPalette({
            name: 'neutral_palette_key_color',
            palette: (s) => s.neutralPalette,
            tone: (s) => s.neutralPalette.keyColor.tone,
        });
    }

    neutralVariantPaletteKeyColor(): DynamicColor {
        return DynamicColor.fromPalette({
            name: 'neutral_variant_palette_key_color',
            palette: (s) => s.neutralVariantPalette,
            tone: (s) => s.neutralVariantPalette.keyColor.tone,
        });
    }

    errorPaletteKeyColor(): DynamicColor {
        return DynamicColor.fromPalette({
            name: 'error_palette_key_color',
            palette: (s) => s.errorPalette,
            tone: (s) => s.errorPalette.keyColor.tone,
        });
    }

    ////////////////////////////////////////////////////////////////
    // Surfaces [S]                                               //
    ////////////////////////////////////////////////////////////////

    surface(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'surface',
            palette: (s) => s.neutralPalette,
            tone: (s) => {
                if (s.isDark) {
                    return 4;
                } else {
                    if (Hct.isYellow(s.neutralPalette.hue)) {
                        return 99;
                    } else {
                        return 98;
                    }
                }
            },
            isBackground: true,
        });
        return color2025
    }

    surfaceDim(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'surface_dim',
            palette: (s) => s.neutralPalette,
            tone: (s) => {
                if (s.isDark) {
                    return 4;
                } else {
                    if (Hct.isYellow(s.neutralPalette.hue)) {
                        return 90;
                    } else {
                        return 87;
                    }
                }
            },
            isBackground: true,
            chromaMultiplier: (s) => {
                if (!s.isDark) {
                    return 2.5;
                }
                return 1;
            },
        });
        return color2025;
    }

    surfaceBright(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'surface_bright',
            palette: (s) => s.neutralPalette,
            tone: (s) => {
                if (s.isDark) {
                    return 18;
                } else {
                    if (Hct.isYellow(s.neutralPalette.hue)) {
                        return 99;
                    } else {
                        return 98;
                    }
                }
            },
            isBackground: true,
            chromaMultiplier: (s) => {
                if (s.isDark) {
                    return 2.5;
                }
                return 1;
            },
        });
        return color2025
    }

    surfaceContainerLowest(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'surface_container_lowest',
            palette: (s) => s.neutralPalette,
            tone: (s) => s.isDark ? 0 : 100,
            isBackground: true,
        });
        return color2025;
    }

    surfaceContainerLow(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'surface_container_low',
            palette: (s) => s.neutralPalette,
            tone: (s) => {
                if (s.isDark) {
                    return 6;
                } else {
                    if (Hct.isYellow(s.neutralPalette.hue)) {
                        return 98;
                    } else {
                        return 96;
                    }
                }
            },
            isBackground: true,
            chromaMultiplier: (s) => {
                return 1.3;
            },
        });
        return color2025;
    }

    surfaceContainer(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'surface_container',
            palette: (s) => s.neutralPalette,
            tone: (s) => {
                if (s.isDark) {
                    return 9;
                } else {
                    if (Hct.isYellow(s.neutralPalette.hue)) {
                        return 96;
                    } else {
                        return 94;
                    }
                }
            },
            isBackground: true,
            chromaMultiplier: (s) => {
                return 1.6;
            },
        });
        return color2025;
    }

    surfaceContainerHigh(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'surface_container_high',
            palette: (s) => s.neutralPalette,
            tone: (s) => {
                if (s.isDark) {
                    return 12;
                } else {
                    if (Hct.isYellow(s.neutralPalette.hue)) {
                        return 94;
                    } else {
                        return 92;
                    }
                }
            },
            isBackground: true,
            chromaMultiplier: (s) => {
                return 1.9;
            },
        });
        return color2025;
    }

    surfaceContainerHighest(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'surface_container_highest',
            palette: (s) => s.neutralPalette,
            tone: (s) => {
                if (s.isDark) {
                    return 15;
                } else {
                    if (Hct.isYellow(s.neutralPalette.hue)) {
                        return 92;
                    } else {
                        return 90;
                    }
                }
            },
            isBackground: true,
            chromaMultiplier: (s) => {
                return 2.2;
            },
        });
        return color2025;
    }

    onSurface(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'on_surface',
            palette: (s) => s.neutralPalette,
            tone: (s) => {
                return DynamicColor.getInitialToneFromBackground(
                    (s) => this.highestSurface(s))(s);
            },
            chromaMultiplier: (s) => {
                return 2.2;
            },
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => s.isDark ? getCurve(11) : getCurve(9),
        });
        return color2025;
    }

    onSurfaceVariant(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'on_surface_variant',
            palette: (s) => s.neutralPalette,
            chromaMultiplier: (s) => {
                return 2.2;
            },
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => (s.isDark ? getCurve(6) : getCurve(4.5))
        });
        return color2025;
    }

    outline(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'outline',
            palette: (s) => s.neutralPalette,
            chromaMultiplier: (s) => {
                return 2.2;
            },
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => getCurve(3),
        });
        return color2025;
    }

    outlineVariant(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'outline_variant',
            palette: (s) => s.neutralPalette,
            chromaMultiplier: (s) => {
                return 2.2;
            },
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => getCurve(1.5),
        });
        return color2025;
    }

    inverseSurface(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'inverse_surface',
            palette: (s) => s.neutralPalette,
            tone: (s) => s.isDark ? 98 : 4,
            isBackground: true,
        });
        return color2025;
    }

    inverseOnSurface(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'inverse_on_surface',
            palette: (s) => s.neutralPalette,
            background: (s) => this.inverseSurface(),
            contrastCurve: (s) => getCurve(7),
        });
        return color2025;
    }

    shadow(): DynamicColor {
        return DynamicColor.fromPalette({
            name: 'shadow',
            palette: (s) => s.neutralPalette,
            tone: (s) => 0,
        });
    }

    scrim(): DynamicColor {
        return DynamicColor.fromPalette({
            name: 'scrim',
            palette: (s) => s.neutralPalette,
            tone: (s) => 0,
        });
    }

    ////////////////////////////////////////////////////////////////
    // Primaries [P]                                              //
    ////////////////////////////////////////////////////////////////

    primary(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'primary',
            palette: (s) => s.primaryPalette,
            tone: (s) => {
                return s.isDark ? 80 : 40;
            },
            isBackground: true,
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => getCurve(4.5),
            toneDeltaPair: (s) => new ToneDeltaPair(
                this.primaryContainer(), this.primary(), 5, 'relative_lighter',
                true, 'farther'),
        });
        return color2025;
    }

    primaryDim(): DynamicColor {
        return DynamicColor.fromPalette({
            name: 'primary_dim',
            palette: (s) => s.primaryPalette,
            tone: (s) => {
                return 85;
            },
            isBackground: true,
            background: (s) => this.surfaceContainerHigh(),
            contrastCurve: (s) => getCurve(4.5),
            toneDeltaPair: (s) => new ToneDeltaPair(
                this.primaryDim(), this.primary(), 5, 'darker', true, 'farther'),
        });
    }

    onPrimary(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'on_primary',
            palette: (s) => s.primaryPalette,
            background: (s) => this.primary(),
            contrastCurve: (s) => getCurve(6),
        });
        return color2025;
    }

    primaryContainer(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'primary_container',
            palette: (s) => s.primaryPalette,
            tone: (s) => {
                return s.isDark ? 30 : 90;
            },
            isBackground: true,
            background: (s) => this.highestSurface(s),
            toneDeltaPair: (s) => undefined,
            contrastCurve: (s) => s.contrastLevel > 0 ?
                getCurve(1.5) :
                undefined,
        });
        return color2025;
    }

    onPrimaryContainer(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'on_primary_container',
            palette: (s) => s.primaryPalette,
            background: (s) => this.primaryContainer(),
            contrastCurve: (s) => getCurve(6),
        });
        return color2025;
    }

    primaryFixed(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'primary_fixed',
            palette: (s) => s.primaryPalette,
            tone: (s) => {
                let tempS = Object.assign({}, s, {isDark: false, contrastLevel: 0});
                return this.primaryContainer().getTone(tempS);
            },
            isBackground: true,
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => s.contrastLevel > 0 ?
                getCurve(1.5) :
                undefined,
        });
        return color2025;
    }

    primaryFixedDim(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'primary_fixed_dim',
            palette: (s) => s.primaryPalette,
            tone: (s) => this.primaryFixed().getTone(s),
            isBackground: true,
            toneDeltaPair: (s) => new ToneDeltaPair(
                this.primaryFixedDim(), this.primaryFixed(), 5, 'darker', true,
                'exact'),
        });
        return color2025;
    }

    onPrimaryFixed(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'on_primary_fixed',
            palette: (s) => s.primaryPalette,
            background: (s) => this.primaryFixedDim(),
            contrastCurve: (s) => getCurve(7),
        });
        return color2025;
    }

    onPrimaryFixedVariant(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'on_primary_fixed_variant',
            palette: (s) => s.primaryPalette,
            background: (s) => this.primaryFixedDim(),
            contrastCurve: (s) => getCurve(4.5),
        });
        return color2025;
    }

    inversePrimary(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'inverse_primary',
            palette: (s) => s.primaryPalette,
            tone: (s) => tMaxC(s.primaryPalette),
            background: (s) => this.inverseSurface(),
            contrastCurve: (s) => getCurve(6),
        });
        return color2025;
    }

    ////////////////////////////////////////////////////////////////
    // Secondaries [Q]                                            //
    ////////////////////////////////////////////////////////////////

    secondary(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'secondary',
            palette: (s) => s.secondaryPalette,
            tone: (s) => {
                return s.isDark ? tMinC(s.secondaryPalette, 0, 98) :
                    tMaxC(s.secondaryPalette);
            },
            isBackground: true,
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => getCurve(4.5),
            toneDeltaPair: (s) => new ToneDeltaPair(
                this.secondaryContainer(), this.secondary(), 5,
                'relative_lighter', true, 'farther')
        });
        return color2025;
    }

    secondaryDim(): DynamicColor {
        return DynamicColor.fromPalette({
            name: 'secondary_dim',
            palette: (s) => s.secondaryPalette,
            tone: (s) => {
                return 85;
            },
            isBackground: true,
            background: (s) => this.surfaceContainerHigh(),
            contrastCurve: (s) => getCurve(4.5),
            toneDeltaPair: (s) => new ToneDeltaPair(
                this.secondaryDim(), this.secondary(), 5, 'darker', true, 'farther'),
        });
    }

    onSecondary(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'on_secondary',
            palette: (s) => s.secondaryPalette,
            background: (s) => this.secondary(),
            contrastCurve: (s) => getCurve(6),
        });
        return color2025;
    }

    secondaryContainer(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'secondary_container',
            palette: (s) => s.secondaryPalette,
            tone: (s) => {
                return s.isDark ? 25 : 90;
            },
            isBackground: true,
            background: (s) => this.highestSurface(s),
            toneDeltaPair: (s) => undefined,
            contrastCurve: (s) => s.contrastLevel > 0 ?
                getCurve(1.5) :
                undefined,
        });
        return color2025;
    }

    onSecondaryContainer(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'on_secondary_container',
            palette: (s) => s.secondaryPalette,
            background: (s) => this.secondaryContainer(),
            contrastCurve: (s) => getCurve(6),
        });
        return color2025;
    }

    secondaryFixed(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'secondary_fixed',
            palette: (s) => s.secondaryPalette,
            tone: (s) => {
                let tempS = Object.assign({}, s, {isDark: false, contrastLevel: 0});
                return this.secondaryContainer().getTone(tempS);
            },
            isBackground: true,
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => s.contrastLevel > 0 ?
                getCurve(1.5) :
                undefined,
        });
        return color2025;
    }

    secondaryFixedDim(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'secondary_fixed_dim',
            palette: (s) => s.secondaryPalette,
            tone: (s) => this.secondaryFixed().getTone(s),
            isBackground: true,
            toneDeltaPair: (s) => new ToneDeltaPair(
                this.secondaryFixedDim(), this.secondaryFixed(), 5, 'darker', true,
                'exact'),
        });
        return color2025;
    }

    onSecondaryFixed(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'on_secondary_fixed',
            palette: (s) => s.secondaryPalette,
            background: (s) => this.secondaryFixedDim(),
            contrastCurve: (s) => getCurve(7),
        });
        return color2025;
    }

    onSecondaryFixedVariant(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'on_secondary_fixed_variant',
            palette: (s) => s.secondaryPalette,
            background: (s) => this.secondaryFixedDim(),
            contrastCurve: (s) => getCurve(4.5),
        });
        return color2025;
    }

    ////////////////////////////////////////////////////////////////
    // Tertiaries [T]                                             //
    ////////////////////////////////////////////////////////////////

    tertiary(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'tertiary',
            palette: (s) => s.tertiaryPalette,
            tone: (s) => {
                return s.isDark ? tMaxC(s.tertiaryPalette, 0, 98) :
                    tMaxC(s.tertiaryPalette);
            },
            isBackground: true,
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) =>
                getCurve(4.5),
            toneDeltaPair: (s) =>
                new ToneDeltaPair(
                    this.tertiaryContainer(), this.tertiary(), 5, 'relative_lighter',
                    true, 'farther')
        });
        return color2025;
    }

    tertiaryDim(): DynamicColor {
        return DynamicColor.fromPalette({
            name: 'tertiary_dim',
            palette: (s) => s.tertiaryPalette,
            tone: (s) => {
                return tMaxC(s.tertiaryPalette);
            },
            isBackground: true,
            background: (s) => this.surfaceContainerHigh(),
            contrastCurve: (s) => getCurve(4.5),
            toneDeltaPair: (s) => new ToneDeltaPair(
                this.tertiaryDim(), this.tertiary(), 5, 'darker', true, 'farther'),
        });
    }

    onTertiary(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'on_tertiary',
            palette: (s) => s.tertiaryPalette,
            background: (s) => this.tertiary(),
            contrastCurve: (s) => getCurve(6),
        });
        return color2025;
    }

    tertiaryContainer(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'tertiary_container',
            palette: (s) => s.tertiaryPalette,
            tone: (s) => {
                return s.isDark ? tMaxC(s.tertiaryPalette, 0, 93) :
                    tMaxC(s.tertiaryPalette, 0, 96);
            },
            isBackground: true,
            background: (s) => this.highestSurface(s),
            toneDeltaPair: (s) => undefined,
            contrastCurve: (s) => s.contrastLevel > 0 ?
                getCurve(1.5) :
                undefined,
        });
        return color2025;
    }

    onTertiaryContainer(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'on_tertiary_container',
            palette: (s) => s.tertiaryPalette,
            background: (s) => this.tertiaryContainer(),
            contrastCurve: (s) => getCurve(6),
        });
        return color2025;
    }

    tertiaryFixed(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'tertiary_fixed',
            palette: (s) => s.tertiaryPalette,
            tone: (s) => {
                let tempS = Object.assign({}, s, {isDark: false, contrastLevel: 0});
                return this.tertiaryContainer().getTone(tempS);
            },
            isBackground: true,
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => s.contrastLevel > 0 ?
                getCurve(1.5) :
                undefined,
        });
        return color2025;
    }

    tertiaryFixedDim(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'tertiary_fixed_dim',
            palette: (s) => s.tertiaryPalette,
            tone: (s) => this.tertiaryFixed().getTone(s),
            isBackground: true,
            toneDeltaPair: (s) => new ToneDeltaPair(
                this.tertiaryFixedDim(), this.tertiaryFixed(), 5, 'darker', true,
                'exact'),
        });
        return color2025;
    }

    onTertiaryFixed(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'on_tertiary_fixed',
            palette: (s) => s.tertiaryPalette,
            background: (s) => this.tertiaryFixedDim(),
            contrastCurve: (s) => getCurve(7),
        });
        return color2025;
    }

    onTertiaryFixedVariant(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'on_tertiary_fixed_variant',
            palette: (s) => s.tertiaryPalette,
            background: (s) => this.tertiaryFixedDim(),
            contrastCurve: (s) => getCurve(4.5),
        });
        return color2025;
    }

    ////////////////////////////////////////////////////////////////
    // Errors [E]                                                 //
    ////////////////////////////////////////////////////////////////

    error(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'error',
            palette: (s) => s.errorPalette,
            tone: (s) => {
                return s.isDark ? tMinC(s.errorPalette, 0, 98) :
                    tMaxC(s.errorPalette);
            },
            isBackground: true,
            background: (s) => this.highestSurface(s),
            contrastCurve: (s) => getCurve(4.5),
            toneDeltaPair: (s) => new ToneDeltaPair(
                this.errorContainer(), this.error(), 5, 'relative_lighter', true,
                'farther')
        });
        return color2025;
    }

    errorDim(): DynamicColor {
        return DynamicColor.fromPalette({
            name: 'error_dim',
            palette: (s) => s.errorPalette,
            tone: (s) => tMinC(s.errorPalette),
            isBackground: true,
            background: (s) => this.surfaceContainerHigh(),
            contrastCurve: (s) => getCurve(4.5),
            toneDeltaPair: (s) => new ToneDeltaPair(
                this.errorDim(), this.error(), 5, 'darker', true, 'farther'),
        });
    }

    onError(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'on_error',
            palette: (s) => s.errorPalette,
            background: (s) => this.error(),
            contrastCurve: (s) => getCurve(6),
        });
        return color2025;
    }

    errorContainer(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'error_container',
            palette: (s) => s.errorPalette,
            tone: (s) => {
                return s.isDark ? tMinC(s.errorPalette, 30, 93) :
                    tMaxC(s.errorPalette, 0, 90);
            },
            isBackground: true,
            background: (s) => this.highestSurface(s),
            toneDeltaPair: (s) => undefined,
            contrastCurve: (s) => s.contrastLevel > 0 ?
                getCurve(1.5) :
                undefined,
        });
        return color2025;
    }

    onErrorContainer(): DynamicColor {
        const color2025: DynamicColor = DynamicColor.fromPalette({
            name: 'on_error_container',
            palette: (s) => s.errorPalette,
            background: (s) => this.errorContainer(),
            contrastCurve: (s) => getCurve(4.5),
        });
        return color2025;
    }

    /////////////////////////////////////////////////////////////////
    // Remapped Colors                                             //
    /////////////////////////////////////////////////////////////////

    surfaceVariant(): DynamicColor {
        const color2025: DynamicColor = Object.assign(
            this.surfaceContainerHighest().clone(), {name: 'surface_variant'});
        return color2025;
    }

    surfaceTint(): DynamicColor {
        const color2025: DynamicColor =
            Object.assign(this.primary().clone(), {name: 'surface_tint'});
        return color2025;
    }

    background(): DynamicColor {
        const color2025: DynamicColor =
            Object.assign(this.surface().clone(), {name: 'background'});
        return color2025;
    }

    onBackground(): DynamicColor {
        const color2025: DynamicColor =
            Object.assign(this.onSurface().clone(), {name: 'on_background'});
        return color2025;
    }


    ////////////////////////////////////////////////////////////////
    // Other                                                      //
    ////////////////////////////////////////////////////////////////

    highestSurface(s: DynamicScheme): DynamicColor {
        return s.isDark ? this.surfaceBright() : this.surfaceDim();
    }
}
