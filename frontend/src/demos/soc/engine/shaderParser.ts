/**
 * Parse the cyber.js GLSL shader file format.
 *
 * Format:
 *   // shaderName //         ← section header (shared attributes/uniforms)
 *   // shaderName.vertex //  ← vertex shader body
 *   // shaderName.fragment // ← fragment shader body
 */
export type ShaderLib = Record<string, string>

export function parseShaderLib(source: string): ShaderLib {
  const lib: ShaderLib = {}
  let current = ''
  let lines: string[] = []

  for (const line of source.split('\n')) {
    const m = line.match(/^\/\/ (\S+) \/\/$/)
    if (m) {
      if (current) lib[current] = lines.join('\n')
      current = m[1]
      lines = []
    } else {
      lines.push(line)
    }
  }
  if (current) lib[current] = lines.join('\n')
  return lib
}

/**
 * Both stages get the same precision preamble so uniforms (like `time`) have
 * matching precision and the program links without error.
 * Vertex shaders default to highp; fragment shaders have no default → both
 * must agree. Using mediump for everything is safe and sufficient.
 */
const PRECISION_PREAMBLE = 'precision mediump float;\n'

/**
 * Build a complete GLSL shader source for a named shader.
 *
 * The shared header section (lib[name]) contains attributes + varyings + uniforms.
 * - Vertex shaders:   full header + precision preamble.
 * - Fragment shaders: header with `attribute` lines removed + precision preamble.
 *
 * Stripping `attribute` from fragment headers prevents the
 * "attribute supported in vertex shaders only" compile error.
 * Sharing the same precision preamble prevents the
 * "Precisions of uniform X differ" link error.
 */
export function buildShader(
  lib: ShaderLib,
  name: string,
  stage: 'vertex' | 'fragment',
): string {
  const rawHeader = lib[name] ?? ''
  const body      = lib[`${name}.${stage}`] ?? ''

  const header =
    stage === 'fragment'
      ? rawHeader
          .split('\n')
          .filter(l => !l.trimStart().startsWith('attribute '))
          .join('\n')
      : rawHeader

  return `${PRECISION_PREAMBLE}${header}\n${body}`
}
