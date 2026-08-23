shader_type canvas_item;
render_mode unshaded;

uniform vec2 source_size = vec2(960.0, 540.0);
uniform sampler2D world_texture : source_color, filter_linear, repeat_disable;
uniform float bloom_threshold : hint_range(0.0, 1.0) = 0.58;
uniform float bloom_strength : hint_range(0.0, 0.5) = 0.16;
uniform float saturation : hint_range(0.0, 2.0) = 1.06;
uniform float contrast : hint_range(0.5, 1.5) = 1.035;
uniform float vignette_strength : hint_range(0.0, 1.0) = 0.24;
uniform bool diagnostic_mode = false;


vec3 bright_sample(vec2 uv) {
	vec3 value = texture(world_texture, clamp(uv, vec2(0.0), vec2(1.0))).rgb;
	return max(value - vec3(bloom_threshold), vec3(0.0));
}


vec3 apply_full_scene_post(vec2 uv) {
	vec2 texel = vec2(1.0) / source_size;
	vec3 source = texture(world_texture, clamp(uv, vec2(0.0), vec2(1.0))).rgb;
	vec3 bloom = vec3(0.0);
	bloom += bright_sample(uv + texel * vec2(-3.0, 0.0));
	bloom += bright_sample(uv + texel * vec2(3.0, 0.0));
	bloom += bright_sample(uv + texel * vec2(0.0, -3.0));
	bloom += bright_sample(uv + texel * vec2(0.0, 3.0));
	bloom += bright_sample(uv + texel * vec2(-2.0, -2.0));
	bloom += bright_sample(uv + texel * vec2(2.0, -2.0));
	bloom += bright_sample(uv + texel * vec2(-2.0, 2.0));
	bloom += bright_sample(uv + texel * vec2(2.0, 2.0));
	bloom *= bloom_strength / 8.0;

	float luma = dot(source, vec3(0.2126, 0.7152, 0.0722));
	vec3 graded = mix(vec3(luma), source, saturation);
	graded = (graded - vec3(0.5)) * contrast + vec3(0.5);
	graded *= vec3(0.975, 1.005, 1.035);
	graded += smoothstep(0.62, 1.0, luma) * vec3(0.030, 0.014, 0.0);
	graded += bloom;

	vec2 centered = uv * 2.0 - vec2(1.0);
	float vignette = smoothstep(0.42, 1.42, dot(centered, centered));
	graded *= 1.0 - vignette * vignette_strength;
	return clamp(graded, vec3(0.0), vec3(1.0));
}


void fragment() {
	if (diagnostic_mode) {
		vec2 tile = floor(UV * 3.0);
		bool post_tile = tile.x == 1.0 && tile.y == 2.0;
		if (post_tile) {
			vec2 local_uv = fract(UV * 3.0);
			COLOR = vec4(apply_full_scene_post(local_uv), 1.0);
		} else {
			COLOR = texture(world_texture, UV);
		}
	} else {
		COLOR = vec4(apply_full_scene_post(UV), 1.0);
	}
}
