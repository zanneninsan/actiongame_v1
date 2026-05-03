import Phaser from "phaser";

export const RAINBOW_FRAGMENT_SHADER = `
#define SHADER_NAME RAINBOW_WIN_FS
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D uMainSampler;
uniform float uTime;
varying vec2 outTexCoord;
varying vec4 outTint;

vec3 rainbow(float t) {
  vec3 phase = vec3(0.0, 0.33, 0.67);
  return 0.55 + 0.45 * cos(6.28318 * (t + phase));
}

void main () {
  vec4 texture = texture2D(uMainSampler, outTexCoord);
  if (texture.a < 0.08) {
    discard;
  }

  float band = fract(outTexCoord.x * 1.85 + uTime * 1.6);
  float shine = smoothstep(0.18, 0.0, abs(fract(band * 3.0) - 0.5));
  float luminance = dot(texture.rgb, vec3(0.299, 0.587, 0.114));
  vec3 rainbowColor = rainbow(band) * (0.58 + luminance * 0.9 + shine * 0.35);
  vec3 color = mix(texture.rgb, rainbowColor, 0.82);
  float alpha = smoothstep(0.08, 0.42, texture.a) * texture.a * outTint.a;
  gl_FragColor = vec4(color * outTint.rgb, alpha);
}
`;

export class RainbowWinPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
  constructor(game: Phaser.Game) {
    super({
      game,
      fragShader: RAINBOW_FRAGMENT_SHADER,
    });
  }

  onPreRender() {
    this.set1f("uTime", this.game.loop.time / 1000);
  }
}

