extends Node2D

enum LayerRole {
	FAR_BACKDROP,
	STAGE_FLOOR,
	UNIT_STAND_INS,
	EMISSIVE_PASS,
	FOREGROUND_OCCLUDER,
}

const DESIGN_SIZE := Vector2(1920.0, 1080.0)
const PARTY_POSITIONS: Array[Vector2] = [
	Vector2(1390.0, 842.0),
	Vector2(1605.0, 872.0),
	Vector2(1770.0, 820.0),
]
const ENEMY_POSITIONS: Array[Vector2] = [
	Vector2(335.0, 824.0),
	Vector2(555.0, 865.0),
	Vector2(780.0, 835.0),
]
const PARTY_BODY := Color("#274c57")
const PARTY_PLATE := Color("#5e8f96")
const PARTY_RIM := Color("#70d8e8")
const ENEMY_BODY := Color("#4a3133")
const ENEMY_PLATE := Color("#786052")
const ENEMY_RIM := Color("#e2ae63")

@export var layer_role: LayerRole = LayerRole.FAR_BACKDROP

var controller: Node


func bind_controller(value: Node) -> void:
	controller = value
	queue_redraw()


func refresh() -> void:
	queue_redraw()


func _draw() -> void:
	var state := _snapshot()
	if state.is_empty():
		return
	match layer_role:
		LayerRole.FAR_BACKDROP:
			_draw_texture_layer(state.get("far_backdrop"))
		LayerRole.STAGE_FLOOR:
			_draw_texture_layer(state.get("stage_floor"))
		LayerRole.UNIT_STAND_INS:
			_draw_unit_stand_ins()
		LayerRole.EMISSIVE_PASS:
			_draw_emissive_pass()
		LayerRole.FOREGROUND_OCCLUDER:
			_draw_texture_layer(state.get("foreground_occluder"))


func _snapshot() -> Dictionary:
	if controller == null or not controller.has_method("render_snapshot"):
		return {}
	var value: Variant = controller.call("render_snapshot")
	if value is Dictionary:
		return value as Dictionary
	return {}


func _draw_texture_layer(texture_value: Variant) -> void:
	if texture_value is Texture2D:
		draw_texture_rect(texture_value as Texture2D, Rect2(Vector2.ZERO, DESIGN_SIZE), false)


func _draw_unit_stand_ins() -> void:
	for unit_index: int in range(ENEMY_POSITIONS.size()):
		_draw_stand_in(ENEMY_POSITIONS[unit_index], false, unit_index)
	for unit_index: int in range(PARTY_POSITIONS.size()):
		_draw_stand_in(PARTY_POSITIONS[unit_index], true, unit_index)


func _draw_stand_in(ground: Vector2, party: bool, unit_index: int) -> void:
	var body := PARTY_BODY if party else ENEMY_BODY
	var plate := PARTY_PLATE if party else ENEMY_PLATE
	var rim := PARTY_RIM if party else ENEMY_RIM
	var facing := -1.0 if party else 1.0
	var height := 184.0 + float(unit_index % 2) * 16.0
	var half_width := 48.0 + float(unit_index) * 3.0
	_draw_ellipse(ground + Vector2(0.0, 8.0), Vector2(72.0, 18.0), Color(0.0, 0.0, 0.0, 0.48))
	draw_rect(Rect2(ground + Vector2(-half_width, -height + 48.0), Vector2(half_width * 2.0, height - 48.0)), body)
	var shoulder_points := PackedVector2Array([
		ground + Vector2(-half_width - 15.0, -height + 63.0),
		ground + Vector2(half_width + 15.0, -height + 63.0),
		ground + Vector2(half_width, -height + 112.0),
		ground + Vector2(-half_width, -height + 112.0),
	])
	draw_colored_polygon(shoulder_points, plate)
	draw_circle(ground + Vector2(0.0, -height + 25.0), 29.0, Color("#171b22"))
	draw_arc(ground + Vector2(0.0, -height + 25.0), 30.0, 0.0, TAU, 28, rim, 3.0, true)
	draw_rect(Rect2(ground + Vector2(-34.0, -height + 89.0), Vector2(68.0, 42.0)), Color(plate, 0.88))
	draw_circle(ground + Vector2(facing * 10.0, -height + 109.0), 8.0, rim)
	draw_line(ground + Vector2(facing * 34.0, -height + 102.0), ground + Vector2(facing * 104.0, -height + 41.0), Color("#222a31"), 14.0, true)
	draw_line(ground + Vector2(facing * 42.0, -height + 96.0), ground + Vector2(facing * 108.0, -height + 39.0), rim, 3.0, true)
	draw_line(ground + Vector2(-28.0, -48.0), ground + Vector2(-30.0, 0.0), Color("#181c23"), 19.0, true)
	draw_line(ground + Vector2(28.0, -48.0), ground + Vector2(30.0, 0.0), Color("#181c23"), 19.0, true)


func _draw_emissive_pass() -> void:
	for unit_index: int in range(ENEMY_POSITIONS.size()):
		_draw_unit_emissive(ENEMY_POSITIONS[unit_index], false, unit_index)
	for unit_index: int in range(PARTY_POSITIONS.size()):
		_draw_unit_emissive(PARTY_POSITIONS[unit_index], true, unit_index)
	for light_index: int in range(8):
		var x := 215.0 + float(light_index) * 214.0
		draw_circle(Vector2(x, 936.0), 5.0, Color(1.0, 0.61, 0.22, 0.72))
		draw_circle(Vector2(x, 936.0), 14.0, Color(1.0, 0.42, 0.12, 0.10))


func _draw_unit_emissive(ground: Vector2, party: bool, unit_index: int) -> void:
	var height := 184.0 + float(unit_index % 2) * 16.0
	var color := PARTY_RIM if party else ENEMY_RIM
	var core := ground + Vector2((-10.0 if party else 10.0), -height + 109.0)
	draw_circle(core, 18.0, Color(color, 0.10))
	draw_circle(core, 7.0, Color(color, 0.92))
	draw_arc(ground + Vector2(0.0, -height + 25.0), 33.0, -2.2, 0.8, 18, Color(color, 0.72), 3.0, true)


func _draw_ellipse(center: Vector2, radii: Vector2, color: Color) -> void:
	var points := PackedVector2Array()
	for point_index: int in range(40):
		var angle := TAU * float(point_index) / 40.0
		points.append(center + Vector2(cos(angle) * radii.x, sin(angle) * radii.y))
	draw_colored_polygon(points, color)
