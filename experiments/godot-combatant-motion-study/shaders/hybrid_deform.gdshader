shader_type canvas_item;
render_mode unshaded;

uniform vec2 anchor_uv = vec2(0.5, 0.95);
uniform float bend_uv : hint_range(-0.004, 0.004) = 0.0;
uniform float squash : hint_range(-0.02, 0.02) = 0.0;
uniform float ripple_uv : hint_range(-0.003, 0.003) = 0.0;
uniform float emissive_gain : hint_range(0.0, 0.18) = 0.0;
uniform vec4 emissive_tint : source_color = vec4(0.20, 0.88, 1.0, 1.0);

void fragment() {
	float above_anchor = clamp((anchor_uv.y - UV.y) / max(anchor_uv.y, 0.0001), 0.0, 1.0);
	float anchored_weight = above_anchor * above_anchor;
	vec2 sample_uv = UV;
	sample_uv.x -= bend_uv * anchored_weight;
	sample_uv.y = anchor_uv.y + (UV.y - anchor_uv.y) / (1.0 + squash);
	sample_uv.y += sin(above_anchor * 9.42477796) * ripple_uv * above_anchor;
	if (sample_uv.x < 0.0 || sample_uv.x > 1.0 || sample_uv.y < 0.0 || sample_uv.y > 1.0) {
		COLOR = vec4(0.0);
	} else {
		vec4 texel = texture(TEXTURE, sample_uv);
		vec3 emission = emissive_tint.rgb * emissive_gain * texel.a;
		COLOR = vec4(texel.rgb + emission, texel.a);
	}
}
