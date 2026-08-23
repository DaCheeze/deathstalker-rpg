extends Node2D

@export_range(0, 1, 1) var layer_kind: int = 0

var state_id: String = "idle"
var state_progress: float = 0.0
var trail_intensity: float = 0.0
var emissive_intensity: float = 0.0
var contact_intensity: float = 0.0
var core_offset: Vector2 = Vector2(0.0, -180.0)
var contact_offset: Vector2 = Vector2(-100.0, -120.0)
var effect_tint: Color = Color("#53dff7")


func configure(sample: Dictionary, derived_core_offset: Vector2, derived_contact_offset: Vector2, tint: Color) -> void:
	state_id = str(sample.get("state_id", "idle"))
	state_progress = clampf(float(sample.get("state_progress", 0.0)), 0.0, 1.0)
	trail_intensity = clampf(float(sample.get("trail", 0.0)), 0.0, 1.0)
	emissive_intensity = clampf(float(sample.get("emissive", 0.0)), 0.0, 1.0)
	contact_intensity = clampf(float(sample.get("contact", 0.0)), 0.0, 1.0)
	core_offset = derived_core_offset
	contact_offset = derived_contact_offset
	effect_tint = tint
	queue_redraw()


func _draw() -> void:
	if layer_kind == 0:
		_draw_trail_layer()
	else:
		_draw_emissive_contact_layer()


func _draw_trail_layer() -> void:
	if trail_intensity <= 0.001:
		return
	var alpha: float = trail_intensity
	match state_id:
		"advance":
			for trail_index: int in range(4):
				var row_alpha: float = alpha * (0.20 - float(trail_index) * 0.035)
				var start: Vector2 = contact_offset + Vector2(38.0 + float(trail_index) * 18.0, -26.0 + float(trail_index) * 18.0)
				var finish: Vector2 = start + Vector2(64.0 + float(trail_index) * 12.0, 0.0)
				draw_line(start, finish, Color(effect_tint, row_alpha), 3.0 - float(trail_index) * 0.35, true)
		"anticipation":
			draw_arc(core_offset, 48.0, -2.4, 0.35, 24, Color(effect_tint, alpha * 0.24), 3.0, true)
			draw_arc(core_offset, 64.0, -2.15, 0.10, 24, Color(effect_tint, alpha * 0.10), 2.0, true)
		"contact":
			var reach: float = 92.0 + 28.0 * sin(state_progress * PI)
			draw_line(contact_offset + Vector2(20.0, -4.0), contact_offset + Vector2(-reach, -10.0), Color(effect_tint, alpha * 0.34), 8.0, true)
			draw_line(contact_offset + Vector2(14.0, 3.0), contact_offset + Vector2(-reach * 0.86, 16.0), Color("#fff2b8", alpha * 0.20), 3.0, true)
		"recovery":
			draw_arc(core_offset, 44.0, -0.2, 2.3, 22, Color(effect_tint, alpha * 0.12), 2.0, true)
		"hit":
			for ray_index: int in range(3):
				var angle: float = -0.75 + float(ray_index) * 0.75
				var ray: Vector2 = Vector2(cos(angle), sin(angle)) * (34.0 + float(ray_index) * 8.0)
				draw_line(core_offset, core_offset + ray, Color("#ff8e7a", alpha * 0.16), 3.0, true)
		"defeat":
			_draw_ellipse(Vector2(34.0, 10.0), Vector2(130.0, 13.0), Color(effect_tint, alpha * 0.08))


func _draw_emissive_contact_layer() -> void:
	if emissive_intensity > 0.001:
		var pulse: float = 0.84 + 0.16 * sin(state_progress * PI)
		var intensity: float = emissive_intensity * pulse
		draw_circle(core_offset, 28.0, Color(effect_tint, intensity * 0.045))
		draw_circle(core_offset, 16.0, Color(effect_tint, intensity * 0.075))
		draw_arc(core_offset, 34.0 + intensity * 8.0, 0.0, TAU, 28, Color(effect_tint, intensity * 0.24), 2.0, true)
		draw_arc(core_offset, 48.0 + intensity * 12.0, -2.7, 0.7, 24, Color(effect_tint, intensity * 0.10), 2.0, true)
	if contact_intensity > 0.001:
		var contact_radius: float = 18.0 + 26.0 * contact_intensity
		draw_circle(contact_offset, contact_radius, Color("#fff2b8", contact_intensity * 0.10))
		draw_arc(contact_offset, contact_radius, 0.0, TAU, 24, Color("#fff2b8", contact_intensity * 0.76), 3.0, true)
		for ray_index: int in range(6):
			var angle: float = TAU * float(ray_index) / 6.0
			var direction: Vector2 = Vector2(cos(angle), sin(angle))
			draw_line(contact_offset + direction * contact_radius * 0.45, contact_offset + direction * contact_radius * 1.45, Color(effect_tint, contact_intensity * 0.44), 2.0, true)
	if state_id == "defeat":
		var shadow_alpha: float = (1.0 - state_progress) * 0.16
		_draw_ellipse(Vector2(22.0, 8.0), Vector2(112.0 + 44.0 * state_progress, 12.0), Color("#78f1ff", shadow_alpha))


func _draw_ellipse(center: Vector2, radii: Vector2, color: Color) -> void:
	var points: PackedVector2Array = PackedVector2Array()
	for point_index: int in range(28):
		var angle: float = TAU * float(point_index) / 28.0
		points.append(center + Vector2(cos(angle) * radii.x, sin(angle) * radii.y))
	draw_colored_polygon(points, color)
