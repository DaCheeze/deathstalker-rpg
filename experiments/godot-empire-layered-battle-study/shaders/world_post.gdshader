shader_type canvas_item;
render_mode unshaded;

uniform float bloom_strength : hint_range(0.0, 0.5) = 0.16;
uniform float grade_strength : hint_range(0.0, 1.0) = 0.24;
uniform float vignette_strength : hint_range(0.0, 1.0) = 0.36;
uniform vec3 cool_shadow_tint = vec3(0.88, 0.94, 1.08);
uniform vec3 warm_highlight_tint = vec3(1.08, 1.01, 0.87);

void fragment() {
	vec2 pixel = TEXTURE_PIXEL_SIZE;
	vec3 source = texture(TEXTURE, UV).rgb;
	vec3 neighborhood = (
		texture(TEXTURE, UV + vec2(-pixel.x, 0.0)).rgb
		+ texture(TEXTURE, UV + vec2(pixel.x, 0.0)).rgb
		+ texture(TEXTURE, UV + vec2(0.0, -pixel.y)).rgb
		+ texture(TEXTURE, UV + vec2(0.0, pixel.y)).rgb
		+ texture(TEXTURE, UV + vec2(-pixel.x, -pixel.y)).rgb
		+ texture(TEXTURE, UV + vec2(pixel.x, -pixel.y)).rgb
		+ texture(TEXTURE, UV + vec2(-pixel.x, pixel.y)).rgb
		+ texture(TEXTURE, UV + vec2(pixel.x, pixel.y)).rgb
	) * 0.125;
	float neighborhood_luma = dot(neighborhood, vec3(0.2126, 0.7152, 0.0722));
	float bloom_gate = smoothstep(0.46, 0.86, neighborhood_luma);
	float source_luma = dot(source, vec3(0.2126, 0.7152, 0.0722));
	vec3 graded = mix(source * cool_shadow_tint, source * warm_highlight_tint, smoothstep(0.18, 0.72, source_luma));
	vec3 color = mix(source, graded, grade_strength);
	color += neighborhood * bloom_gate * bloom_strength;
	vec2 centered = UV * 2.0 - 1.0;
	float vignette = smoothstep(0.45, 1.28, dot(centered, centered));
	color *= 1.0 - vignette * vignette_strength;
	COLOR = vec4(color, 1.0);
}
