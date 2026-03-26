/** Low-level WebGL utilities */

export function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`Shader compile error (${type === gl.VERTEX_SHADER ? 'vert' : 'frag'}):\n${info}`)
  }
  return shader
}

export function createProgram(
  gl: WebGLRenderingContext,
  vertSrc: string,
  fragSrc: string,
): WebGLProgram {
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc)
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc)
  const program = gl.createProgram()!
  gl.attachShader(program, vert)
  gl.attachShader(program, frag)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Program link error: ${gl.getProgramInfoLog(program)}`)
  }
  gl.deleteShader(vert)
  gl.deleteShader(frag)
  return program
}

export function createStaticBuffer(
  gl: WebGLRenderingContext,
  data: Float32Array,
): WebGLBuffer {
  const buf = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
  return buf
}

export function createDynamicBuffer(
  gl: WebGLRenderingContext,
  byteSize: number,
): WebGLBuffer {
  const buf = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, byteSize, gl.DYNAMIC_DRAW)
  return buf
}

/**
 * Load a texture from `url`.
 *
 * Uses LINEAR filtering + CLAMP_TO_EDGE on both axes — safe for any image
 * size, including non-power-of-two textures (earth maps, etc.).
 * `generateMipmap` is intentionally skipped because NPOT textures are
 * not mipmappable in WebGL1 without the OES_texture_npot extension.
 */
export function loadTexture(
  gl: WebGLRenderingContext,
  url: string,
): WebGLTexture {
  const tex = gl.createTexture()!

  // Placeholder 1×1 dark pixel while the image is loading
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([20, 20, 40]))
  _setTexParams(gl, false)

  const img = new Image()
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img)
    _setTexParams(gl, false)
  }
  img.src = url
  return tex
}

function _setTexParams(gl: WebGLRenderingContext, mipmap: boolean): void {
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    mipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR,
  )
  // CLAMP_TO_EDGE is required for NPOT textures in WebGL1
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
}
