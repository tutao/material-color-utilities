/**
 * @license
 * Copyright 2022 Google LLC
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

import {SpecVersion} from './color_spec.js';
import {DynamicColor} from './dynamic_color.js';
import {MaterialDynamicColors} from './material_dynamic_colors.js';

/**
 * @param sourceColorArgb The source color of the theme as an ARGB 32-bit
 *     integer.
 * @param variant The variant, or style, of the theme.
 * @param contrastLevel Value from -1 to 1. -1 represents minimum contrast, 0
 *     represents standard (i.e. the design as spec'd), and 1 represents maximum
 *     contrast.
 * @param isDark Whether the scheme is in dark mode or light mode.
 * @param platform The platform on which this scheme is intended to be used.
 * @param specVersion The version of the design spec that this scheme is based
 *     on.
 * @param primaryPalette Given a tone, produces a color. Hue and chroma of the
 *     color are specified in the design specification of the variant. Usually
 *     colorful.
 * @param secondaryPalette Given a tone, produces a color. Hue and chroma of the
 *     color are specified in the design specification of the variant. Usually
 *     less colorful.
 * @param tertiaryPalette Given a tone, produces a color. Hue and chroma of the
 *     color are specified in the design specification of the variant. Usually a
 *     different hue from primary and colorful.
 * @param neutralPalette Given a tone, produces a color. Hue and chroma of the
 *     color are specified in the design specification of the variant. Usually
 *     not colorful at all, intended for background & surface colors.
 * @param neutralVariantPalette Given a tone, produces a color. Hue and chroma
 *     of the color are specified in the design specification of the variant.
 *     Usually not colorful, but slightly more colorful than Neutral. Intended
 *     for backgrounds & surfaces.
 */
interface DynamicSchemeOptions {
  sourceColorHct: Hct;
  contrastLevel: number;
  isDark: boolean;
  specVersion?: SpecVersion;
  primaryPalette?: TonalPalette;
  secondaryPalette?: TonalPalette;
  tertiaryPalette?: TonalPalette;
  neutralPalette?: TonalPalette;
  neutralVariantPalette?: TonalPalette;
  errorPalette?: TonalPalette;
}

/**
 * A delegate that provides the palettes of a DynamicScheme.
 *
 * This is used to allow different implementations of the palette calculation
 * logic for different spec versions.
 */
interface DynamicSchemePalettesDelegate {
  getPrimaryPalette:
      (sourceColorHct: Hct, isDark: boolean,
       contrastLevel: number) => TonalPalette;

  getSecondaryPalette:
      ( sourceColorHct: Hct, isDark: boolean,
       contrastLevel: number) => TonalPalette;

  getTertiaryPalette:
      ( sourceColorHct: Hct, isDark: boolean,
       contrastLevel: number) => TonalPalette;

  getNeutralPalette:
      ( sourceColorHct: Hct, isDark: boolean,
       contrastLevel: number) => TonalPalette;

  getNeutralVariantPalette:
      ( sourceColorHct: Hct, isDark: boolean,
       contrastLevel: number) => TonalPalette;

  getErrorPalette:
      ( sourceColorHct: Hct, isDark: boolean,
       contrastLevel: number) => TonalPalette | undefined;
}

/**
 * Constructed by a set of values representing the current UI state (such as
 * whether or not its dark theme, what the theme style is, etc.), and
 * provides a set of TonalPalettes that can create colors that fit in
 * with the theme style. Used by DynamicColor to resolve into a color.
 */
export class DynamicScheme {
  static readonly DEFAULT_SPEC_VERSION = '2021';

  /**
   * The source color of the theme as an HCT color.
   */
  sourceColorHct: Hct;

  /** The source color of the theme as an ARGB 32-bit integer. */
  readonly sourceColorArgb: number;

  /**
   * Value from -1 to 1. -1 represents minimum contrast. 0 represents standard
   * (i.e. the design as spec'd), and 1 represents maximum contrast.
   */
  readonly contrastLevel: number;

  /** Whether the scheme is in dark mode or light mode. */
  readonly isDark: boolean;

  /** The version of the design spec that this scheme is based on. */
  readonly specVersion: SpecVersion;

  /**
   * Given a tone, produces a color. Hue and chroma of the
   * color are specified in the design specification of the variant. Usually
   * colorful.
   */
  readonly primaryPalette: TonalPalette;

  /**
   * Given a tone, produces a color. Hue and chroma of
   * the color are specified in the design specification of the variant. Usually
   * less colorful.
   */
  readonly secondaryPalette: TonalPalette;

  /**
   * Given a tone, produces a color. Hue and chroma of
   * the color are specified in the design specification of the variant. Usually
   * a different hue from primary and colorful.
   */
  readonly tertiaryPalette: TonalPalette;

  /**
   * Given a tone, produces a color. Hue and chroma of the
   * color are specified in the design specification of the variant. Usually not
   * colorful at all, intended for background & surface colors.
   */
  readonly neutralPalette: TonalPalette;

  /**
   * Given a tone, produces a color. Hue and chroma
   * of the color are specified in the design specification of the variant.
   * Usually not colorful, but slightly more colorful than Neutral. Intended for
   * backgrounds & surfaces.
   */
  readonly neutralVariantPalette: TonalPalette;

  /**
   * Given a tone, produces a reddish, colorful, color.
   */
  errorPalette: TonalPalette;

  readonly colors: MaterialDynamicColors;

  constructor(args: DynamicSchemeOptions) {
    this.sourceColorArgb = args.sourceColorHct.toInt();
    this.contrastLevel = args.contrastLevel;
    this.isDark = args.isDark;
    this.specVersion = args.specVersion ?? '2021';
    this.sourceColorHct = args.sourceColorHct;
    this.primaryPalette = args.primaryPalette ??
        getSpec(this.specVersion)
            .getPrimaryPalette(
                args.sourceColorHct, this.isDark, this.contrastLevel);
    this.secondaryPalette = args.secondaryPalette ??
        getSpec(this.specVersion)
            .getSecondaryPalette(
                args.sourceColorHct, this.isDark, this.contrastLevel);
    this.tertiaryPalette = args.tertiaryPalette ??
        getSpec(this.specVersion)
            .getTertiaryPalette(
                args.sourceColorHct, this.isDark, this.contrastLevel);
    this.neutralPalette = args.neutralPalette ??
        getSpec(this.specVersion)
            .getNeutralPalette(
                args.sourceColorHct, this.isDark, this.contrastLevel);
    this.neutralVariantPalette = args.neutralVariantPalette ??
        getSpec(this.specVersion)
            .getNeutralVariantPalette(
                args.sourceColorHct, this.isDark, this.contrastLevel);
    this.errorPalette = args.errorPalette ??
        getSpec(this.specVersion)
            .getErrorPalette(
                args.sourceColorHct, this.isDark, this.contrastLevel) ??
        TonalPalette.fromHueAndChroma(25.0, 84.0);

    this.colors = new MaterialDynamicColors();
  }

  toString(): string {
    return `Scheme: ` +
        `mode=${this.isDark ? 'dark' : 'light'}, ` +
        `contrastLevel=${this.contrastLevel.toFixed(1)}, ` +
        `seed=${this.sourceColorHct.toString()}, ` +
        `specVersion=${this.specVersion}`
  }

  /**
   * Returns a new hue based on a piecewise function and input color hue.
   *
   * For example, for the following function:
   * result = 26 if 0 <= hue < 101
   * result = 39 if 101 <= hue < 210
   * result = 28 if 210 <= hue < 360
   *
   * call the function as:
   *
   * const hueBreakpoints = [0, 101, 210, 360];
   * const hues = [26, 39, 28];
   * const result = scheme.piecewise(hue, hueBreakpoints, hues);
   *
   * @param sourceColorHct The input value.
   * @param hueBreakpoints The breakpoints, in sorted order. No default lower or
   *     upper bounds are assumed.
   * @param hues The hues that should be applied when source color's hue is >=
   *     the same index in hueBrakpoints array, and < the hue at the next index
   *     in hueBrakpoints array. Otherwise, the source color's hue is returned.
   */
  static getPiecewiseHue(
      sourceColorHct: Hct, hueBreakpoints: number[], hues: number[]): number {
    const size = Math.min(hueBreakpoints.length - 1, hues.length);
    const sourceHue = sourceColorHct.hue;
    for (let i = 0; i < size; i++) {
      if (sourceHue >= hueBreakpoints[i] && sourceHue < hueBreakpoints[i + 1]) {
        return math.sanitizeDegreesDouble(hues[i]);
      }
    }
    // No condition matched, return the source hue.
    return sourceHue;
  }

  /**
   * Returns a shifted hue based on a piecewise function and input color hue.
   *
   * For example, for the following function:
   * result = hue + 26 if 0 <= hue < 101
   * result = hue - 39 if 101 <= hue < 210
   * result = hue + 28 if 210 <= hue < 360
   *
   * call the function as:
   *
   * const hueBreakpoints = [0, 101, 210, 360];
   * const hues = [26, -39, 28];
   * const result = scheme.getRotatedHue(hue, hueBreakpoints, hues);
   *
   * @param sourceColorHct the source color of the theme, in HCT.
   * @param hueBreakpoints The "breakpoints", i.e. the hues at which a rotation
   *     should be apply. No default lower or upper bounds are assumed.
   * @param rotations The rotation that should be applied when source color's
   *     hue is >= the same index in hues array, and < the hue at the next
   *     index in hues array. Otherwise, the source color's hue is returned.
   */
  static getRotatedHue(
      sourceColorHct: Hct, hueBreakpoints: number[],
      rotations: number[]): number {
    let rotation = DynamicScheme.getPiecewiseHue(
        sourceColorHct, hueBreakpoints, rotations);
    if (Math.min(hueBreakpoints.length - 1, rotations.length) <= 0) {
      // No condition matched, return the source hue.
      rotation = 0;
    }
    return math.sanitizeDegreesDouble(sourceColorHct.hue + rotation);
  }

  getArgb(dynamicColor: DynamicColor): number {
    return dynamicColor.getArgb(this);
  }

  getHct(dynamicColor: DynamicColor): Hct {
    return dynamicColor.getHct(this);
  }

  // Palette key colors

  get primaryPaletteKeyColor(): number {
    return this.getArgb(this.colors.primaryPaletteKeyColor());
  }

  get secondaryPaletteKeyColor(): number {
    return this.getArgb(this.colors.secondaryPaletteKeyColor());
  }

  get tertiaryPaletteKeyColor(): number {
    return this.getArgb(this.colors.tertiaryPaletteKeyColor());
  }

  get neutralPaletteKeyColor(): number {
    return this.getArgb(this.colors.neutralPaletteKeyColor());
  }

  get neutralVariantPaletteKeyColor(): number {
    return this.getArgb(this.colors.neutralVariantPaletteKeyColor());
  }

  get errorPaletteKeyColor(): number {
    return this.getArgb(this.colors.errorPaletteKeyColor());
  }

  // Surface colors

  get background(): number {
    return this.getArgb(this.colors.background());
  }

  get onBackground(): number {
    return this.getArgb(this.colors.onBackground());
  }

  get surface(): number {
    return this.getArgb(this.colors.surface());
  }

  get surfaceDim(): number {
    return this.getArgb(this.colors.surfaceDim());
  }

  get surfaceBright(): number {
    return this.getArgb(this.colors.surfaceBright());
  }

  get surfaceContainerLowest(): number {
    return this.getArgb(this.colors.surfaceContainerLowest());
  }

  get surfaceContainerLow(): number {
    return this.getArgb(this.colors.surfaceContainerLow());
  }

  get surfaceContainer(): number {
    return this.getArgb(this.colors.surfaceContainer());
  }

  get surfaceContainerHigh(): number {
    return this.getArgb(this.colors.surfaceContainerHigh());
  }

  get surfaceContainerHighest(): number {
    return this.getArgb(this.colors.surfaceContainerHighest());
  }

  get onSurface(): number {
    return this.getArgb(this.colors.onSurface());
  }

  get surfaceVariant(): number {
    return this.getArgb(this.colors.surfaceVariant());
  }

  get onSurfaceVariant(): number {
    return this.getArgb(this.colors.onSurfaceVariant());
  }

  get inverseSurface(): number {
    return this.getArgb(this.colors.inverseSurface());
  }

  get inverseOnSurface(): number {
    return this.getArgb(this.colors.inverseOnSurface());
  }

  get outline(): number {
    return this.getArgb(this.colors.outline());
  }

  get outlineVariant(): number {
    return this.getArgb(this.colors.outlineVariant());
  }

  get shadow(): number {
    return this.getArgb(this.colors.shadow());
  }

  get scrim(): number {
    return this.getArgb(this.colors.scrim());
  }

  get surfaceTint(): number {
    return this.getArgb(this.colors.surfaceTint());
  }

  // Primary colors

  get primary(): number {
    return this.getArgb(this.colors.primary());
  }

  get primaryDim(): number {
    const primaryDim = this.colors.primaryDim();
    if (primaryDim === undefined) {
      throw new Error('`primaryDim` color is undefined prior to 2025 spec.');
    }
    return this.getArgb(primaryDim);
  }

  get onPrimary(): number {
    return this.getArgb(this.colors.onPrimary());
  }

  get primaryContainer(): number {
    return this.getArgb(this.colors.primaryContainer());
  }

  get onPrimaryContainer(): number {
    return this.getArgb(this.colors.onPrimaryContainer());
  }

  get primaryFixed(): number {
    return this.getArgb(this.colors.primaryFixed());
  }

  get primaryFixedDim(): number {
    return this.getArgb(this.colors.primaryFixedDim());
  }

  get onPrimaryFixed(): number {
    return this.getArgb(this.colors.onPrimaryFixed());
  }

  get onPrimaryFixedVariant(): number {
    return this.getArgb(this.colors.onPrimaryFixedVariant());
  }

  get inversePrimary(): number {
    return this.getArgb(this.colors.inversePrimary());
  }

  // Secondary colors

  get secondary(): number {
    return this.getArgb(this.colors.secondary());
  }

  get secondaryDim(): number {
    const secondaryDim = this.colors.secondaryDim();
    if (secondaryDim === undefined) {
      throw new Error('`secondaryDim` color is undefined prior to 2025 spec.');
    }
    return this.getArgb(secondaryDim);
  }

  get onSecondary(): number {
    return this.getArgb(this.colors.onSecondary());
  }

  get secondaryContainer(): number {
    return this.getArgb(this.colors.secondaryContainer());
  }

  get onSecondaryContainer(): number {
    return this.getArgb(this.colors.onSecondaryContainer());
  }

  get secondaryFixed(): number {
    return this.getArgb(this.colors.secondaryFixed());
  }

  get secondaryFixedDim(): number {
    return this.getArgb(this.colors.secondaryFixedDim());
  }

  get onSecondaryFixed(): number {
    return this.getArgb(this.colors.onSecondaryFixed());
  }

  get onSecondaryFixedVariant(): number {
    return this.getArgb(this.colors.onSecondaryFixedVariant());
  }

  // Tertiary colors

  get tertiary(): number {
    return this.getArgb(this.colors.tertiary());
  }

  get tertiaryDim(): number {
    const tertiaryDim = this.colors.tertiaryDim();
    if (tertiaryDim === undefined) {
      throw new Error('`tertiaryDim` color is undefined prior to 2025 spec.');
    }
    return this.getArgb(tertiaryDim);
  }

  get onTertiary(): number {
    return this.getArgb(this.colors.onTertiary());
  }

  get tertiaryContainer(): number {
    return this.getArgb(this.colors.tertiaryContainer());
  }

  get onTertiaryContainer(): number {
    return this.getArgb(this.colors.onTertiaryContainer());
  }

  get tertiaryFixed(): number {
    return this.getArgb(this.colors.tertiaryFixed());
  }

  get tertiaryFixedDim(): number {
    return this.getArgb(this.colors.tertiaryFixedDim());
  }

  get onTertiaryFixed(): number {
    return this.getArgb(this.colors.onTertiaryFixed());
  }

  get onTertiaryFixedVariant(): number {
    return this.getArgb(this.colors.onTertiaryFixedVariant());
  }

  // Error colors

  get error(): number {
    return this.getArgb(this.colors.error());
  }

  get errorDim(): number {
    const errorDim = this.colors.errorDim();
    if (errorDim === undefined) {
      throw new Error('`errorDim` color is undefined prior to 2025 spec.');
    }
    return this.getArgb(errorDim);
  }

  get onError(): number {
    return this.getArgb(this.colors.onError());
  }

  get errorContainer(): number {
    return this.getArgb(this.colors.errorContainer());
  }

  get onErrorContainer(): number {
    return this.getArgb(this.colors.onErrorContainer());
  }
}

/**
 * A delegate for the palettes of a DynamicScheme in the 2021 spec.
 */
class DynamicSchemePalettesDelegateImpl2021 implements
    DynamicSchemePalettesDelegate {
  //////////////////////////////////////////////////////////////////
  // Scheme Palettes                                              //
  //////////////////////////////////////////////////////////////////

  getPrimaryPalette(
       sourceColorHct: Hct, isDark: boolean,
      contrastLevel: number): TonalPalette {
    return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 12.0);
  }

  getSecondaryPalette(
       sourceColorHct: Hct, isDark: boolean,
      contrastLevel: number): TonalPalette {
    return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 8.0);
  }

  getTertiaryPalette(
       sourceColorHct: Hct, isDark: boolean,
      contrastLevel: number): TonalPalette {
    return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 16.0);
  }

  getNeutralPalette(
       sourceColorHct: Hct, isDark: boolean,
      contrastLevel: number): TonalPalette {
    return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 2.0);
  }

  getNeutralVariantPalette(
       sourceColorHct: Hct, isDark: boolean,
      contrastLevel: number): TonalPalette {
    return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 2.0);
  }

  getErrorPalette(
       sourceColorHct: Hct, isDark: boolean,
      contrastLevel: number): TonalPalette|undefined {
    return undefined;
  }
}

/**
 * A delegate for the palettes of a DynamicScheme in the 2025 spec.
 */
class DynamicSchemePalettesDelegateImpl2025 extends
    DynamicSchemePalettesDelegateImpl2021 {
  //////////////////////////////////////////////////////////////////
  // Scheme Palettes                                              //
  //////////////////////////////////////////////////////////////////

  override getPrimaryPalette(
       sourceColorHct: Hct, isDark: boolean,
      contrastLevel: number): TonalPalette {
    return TonalPalette.fromHueAndChroma(
        sourceColorHct.hue,
        (Hct.isBlue(sourceColorHct.hue) ? 12 : 8));
  }

  override getSecondaryPalette(
       sourceColorHct: Hct, isDark: boolean,
      contrastLevel: number): TonalPalette {
    return TonalPalette.fromHueAndChroma(
        sourceColorHct.hue,
        (Hct.isBlue(sourceColorHct.hue) ? 6 : 4));
  }

  override getTertiaryPalette(
       sourceColorHct: Hct, isDark: boolean,
      contrastLevel: number): TonalPalette {
    return TonalPalette.fromHueAndChroma(
        DynamicScheme.getRotatedHue(
            sourceColorHct, [0, 38, 105, 161, 204, 278, 333, 360],
            [-32, 26, 10, -39, 24, -15, -32]),
        20);
  }


  override getNeutralPalette(
       sourceColorHct: Hct, isDark: boolean,
      contrastLevel: number): TonalPalette {
    return TonalPalette.fromHueAndChroma(
        sourceColorHct.hue, 1.4);
  }

  override getNeutralVariantPalette(
       sourceColorHct: Hct, isDark: boolean,
      contrastLevel: number): TonalPalette {
    return TonalPalette.fromHueAndChroma(
        sourceColorHct.hue, 1.4 * 2.2);
  }

  override getErrorPalette(
       sourceColorHct: Hct, isDark: boolean,
      contrastLevel: number): TonalPalette|undefined {
    const errorHue = DynamicScheme.getPiecewiseHue(
        sourceColorHct, [0, 3, 13, 23, 33, 43, 153, 273, 360],
        [12, 22, 32, 12, 22, 32, 22, 12]);
    return TonalPalette.fromHueAndChroma(
        errorHue, 50);
  }
}

const spec2021 = new DynamicSchemePalettesDelegateImpl2021();
const spec2025 = new DynamicSchemePalettesDelegateImpl2025();

/**
 * Returns the DynamicSchemePalettesDelegate for the given spec version.
 */
function getSpec(specVersion: SpecVersion):
    DynamicSchemePalettesDelegate {
  return specVersion === '2025' ? spec2025 : spec2021;
}
