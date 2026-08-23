extends Node2D

const DESIGN_SIZE: Vector2 = Vector2(1920.0, 1080.0)
const HALF_SIZE: Vector2 = Vector2(960.0, 540.0)
const MODE_A: int = 0
const MODE_B: int = 1
const PARTY_BODY: Color = Color("#315c61")
const ENEMY_BODY: Color = Color("#5b3640")
const UI_WHITE: Color = Color("#f8fafc")
const UI_MUTED: Color = Color("#a7b3c4")
const UI_CYAN: Color = Color("#63e6ff")
const UI_GOLD: Color = Color("#ffcf67")
const DISRUPTOR_GREEN: Color = Color("#53f2a8")

@export_range(1, 9, 1) var layer_number: int = 1

var controller: Node


func bind_controller(value: Node) -> void:
	controller = value
	queue_redraw()


func refresh() -> void:
	queue_redraw()


func _draw() -> void:
	var state: Dictionary = _snapshot()
	if state.is_empty():
		return
	match layer_number:
		1:
			_draw_starfield(state)
		2:
			_draw_far_backdrop(state)
		3:
			_draw_stage_floor(state)
		4:
			_draw_unit_layer(state, "enemy")
		5:
			_draw_unit_layer(state, "party")
		6:
			_draw_emissive_pass(state)
		7:
			_draw_foreground_occluders(state)
		8:
			_draw_half_resolution_post(state)
		9:
			_draw_ui(state)


func _snapshot() -> Dictionary:
	if controller == null or not controller.has_method("render_snapshot"):
		return {}
	var snapshot_value: Variant = controller.call("render_snapshot")
	if snapshot_value is Dictionary:
		return snapshot_value as Dictionary
	return {}


func _draw_starfield(state: Dictionary) -> void:
	draw_rect(Rect2(Vector2.ZERO, DESIGN_SIZE), Color("#050914"))
	var texture_value: Variant = state.get("starfield_texture")
	if texture_value is Texture2D:
		draw_texture_rect(texture_value as Texture2D, Rect2(Vector2.ZERO, DESIGN_SIZE), false)


func _draw_far_backdrop(state: Dictionary) -> void:
	var backgrounds_value: Variant = state.get("backgrounds", [])
	if not (backgrounds_value is Array):
		return
	var backgrounds: Array = backgrounds_value as Array
	if backgrounds.size() != 2 or not (backgrounds[0] is Texture2D) or not (backgrounds[1] is Texture2D):
		return
	var texture_a: Texture2D = backgrounds[0] as Texture2D
	var texture_b: Texture2D = backgrounds[1] as Texture2D
	var full_rect: Rect2 = Rect2(Vector2.ZERO, DESIGN_SIZE)
	var mode: int = int(state.get("background_mode", MODE_A))
	if mode == MODE_A:
		draw_texture_rect(texture_a, full_rect, false)
	elif mode == MODE_B:
		draw_texture_rect(texture_b, full_rect, false)
	else:
		var left_destination: Rect2 = Rect2(0.0, 0.0, DESIGN_SIZE.x * 0.5, DESIGN_SIZE.y)
		var right_destination: Rect2 = Rect2(DESIGN_SIZE.x * 0.5, 0.0, DESIGN_SIZE.x * 0.5, DESIGN_SIZE.y)
		var source_size: Vector2 = texture_a.get_size()
		var left_source: Rect2 = Rect2(0.0, 0.0, source_size.x * 0.5, source_size.y)
		var right_source: Rect2 = Rect2(source_size.x * 0.5, 0.0, source_size.x * 0.5, source_size.y)
		draw_texture_rect_region(texture_a, left_destination, left_source)
		draw_texture_rect_region(texture_b, right_destination, right_source)
		draw_line(Vector2(DESIGN_SIZE.x * 0.5, 0.0), Vector2(DESIGN_SIZE.x * 0.5, DESIGN_SIZE.y), UI_WHITE, 2.0)


func _draw_stage_floor(state: Dictionary) -> void:
	# Sharp static stage geometry. It is cached by CanvasItem until explicitly redrawn.
	if bool(state.get("diagnostic_mosaic", false)):
		draw_rect(Rect2(Vector2.ZERO, DESIGN_SIZE), Color("#17202c"))
	var stage: PackedVector2Array = PackedVector2Array([
		Vector2(0.0, 900.0), Vector2(DESIGN_SIZE.x, 900.0),
		Vector2(DESIGN_SIZE.x, DESIGN_SIZE.y), Vector2(0.0, DESIGN_SIZE.y),
	])
	draw_colored_polygon(stage, Color(0.015, 0.025, 0.04, 0.23))
	draw_line(Vector2(0.0, 970.0), Vector2(DESIGN_SIZE.x, 970.0), Color(0.36, 0.74, 0.76, 0.17), 2.0)
	for lane_index: int in range(13):
		var x: float = float(lane_index) * 160.0
		draw_line(Vector2(960.0, 900.0), Vector2(x, 1080.0), Color(0.34, 0.58, 0.62, 0.07), 1.0)
	for cross_index: int in range(4):
		var y: float = 930.0 + float(cross_index) * 42.0
		draw_line(Vector2(0.0, y), Vector2(DESIGN_SIZE.x, y), Color(0.24, 0.40, 0.45, 0.05), 1.0)


func _draw_unit_layer(state: Dictionary, requested_side: String) -> void:
	var units_value: Variant = state.get("units", [])
	var positions_value: Variant = state.get("positions", {})
	if not (units_value is Array) or not (positions_value is Dictionary):
		return
	var units: Array = units_value as Array
	var positions: Dictionary = positions_value as Dictionary
	var playback_seconds: float = float(state.get("playback_seconds", 0.0))
	for raw_unit: Variant in units:
		if not (raw_unit is Dictionary):
			continue
		var unit: Dictionary = raw_unit as Dictionary
		if str(unit.get("side", "")) != requested_side:
			continue
		var unit_id: String = str(unit.get("id", ""))
		if not positions.has(unit_id):
			continue
		var position: Vector2 = positions[unit_id] as Vector2
		_draw_unit_body(unit, position, playback_seconds)


func _draw_unit_body(unit: Dictionary, position: Vector2, playback_seconds: float) -> void:
	var unit_id: String = str(unit.get("id", ""))
	var side: String = str(unit.get("side", "enemy"))
	var role: String = str(unit.get("role", "QUEUE"))
	var party_side: bool = side == "party"
	var facing: float = -1.0 if party_side else 1.0
	var scale_value: float = float(unit.get("scale", 1.0))
	var body: Color = PARTY_BODY if party_side else ENEMY_BODY
	var base: Vector2 = _unit_base(unit_id, position, playback_seconds)

	_draw_ellipse_shape(base + Vector2(0.0, 23.0), Vector2(70.0 * scale_value, 14.0), Color(0.0, 0.0, 0.0, 0.62))
	draw_rect(Rect2(base + Vector2(-31.0, -34.0) * scale_value, Vector2(24.0, 52.0) * scale_value), body.darkened(0.12))
	draw_rect(Rect2(base + Vector2(7.0, -34.0) * scale_value, Vector2(24.0, 52.0) * scale_value), body.darkened(0.20))
	draw_rect(Rect2(base + Vector2(-37.0, 12.0) * scale_value, Vector2(34.0, 10.0) * scale_value), Color("#111827"))
	draw_rect(Rect2(base + Vector2(3.0, 12.0) * scale_value, Vector2(34.0, 10.0) * scale_value), Color("#111827"))
	var torso: PackedVector2Array = PackedVector2Array([
		base + Vector2(-40.0, -116.0) * scale_value,
		base + Vector2(40.0, -116.0) * scale_value,
		base + Vector2(31.0, -31.0) * scale_value,
		base + Vector2(-31.0, -31.0) * scale_value,
	])
	draw_colored_polygon(torso, body)
	draw_rect(Rect2(base + Vector2(-22.0, -94.0) * scale_value, Vector2(44.0, 45.0) * scale_value), body.lightened(0.13))
	draw_rect(Rect2(base + Vector2(-54.0, -108.0) * scale_value, Vector2(22.0, 54.0) * scale_value), body.lightened(0.07))
	draw_rect(Rect2(base + Vector2(32.0, -108.0) * scale_value, Vector2(22.0, 54.0) * scale_value), body.darkened(0.08))
	draw_colored_polygon(PackedVector2Array([
		base + Vector2(-40.0, -116.0) * scale_value,
		base + Vector2(-31.0, -116.0) * scale_value,
		base + Vector2(-24.0, -31.0) * scale_value,
		base + Vector2(-31.0, -31.0) * scale_value,
	]), body.lightened(0.20))
	draw_colored_polygon(PackedVector2Array([
		base + Vector2(-22.0, -157.0) * scale_value,
		base + Vector2(0.0, -171.0) * scale_value,
		base + Vector2(22.0, -157.0) * scale_value,
		base + Vector2(17.0, -118.0) * scale_value,
		base + Vector2(-17.0, -118.0) * scale_value,
	]), body.darkened(0.18))
	_draw_body_weapon(base + Vector2(0.0, -80.0) * scale_value, role, facing, scale_value)
	var role_glyph: String = role.substr(0, 1)
	draw_string(ThemeDB.fallback_font, base + Vector2(-7.0, -188.0) * scale_value, role_glyph, HORIZONTAL_ALIGNMENT_LEFT, -1.0, 17, Color("#dbe4ee"))


func _draw_body_weapon(center: Vector2, role: String, facing: float, scale_value: float) -> void:
	var hand: Vector2 = center + Vector2(45.0 * facing, 6.0) * scale_value
	if role == "POWER":
		var heavy_tip: Vector2 = hand + Vector2(80.0 * facing, -46.0) * scale_value
		draw_line(hand, heavy_tip, Color("#8c98a7"), 13.0 * scale_value, true)
	elif role == "CRITICAL":
		for offset: float in [-9.0, 9.0]:
			var start: Vector2 = hand + Vector2(0.0, offset) * scale_value
			var twin_tip: Vector2 = start + Vector2(64.0 * facing, -23.0 + offset * 0.35) * scale_value
			draw_line(start, twin_tip, Color("#9aa6b5"), 5.0 * scale_value, true)
	else:
		var queue_tip: Vector2 = hand + Vector2(70.0 * facing, -32.0) * scale_value
		draw_line(hand, queue_tip, Color("#8c98a7"), 8.0 * scale_value, true)


func _draw_emissive_pass(state: Dictionary) -> void:
	var units_value: Variant = state.get("units", [])
	var positions_value: Variant = state.get("positions", {})
	if not (units_value is Array) or not (positions_value is Dictionary):
		return
	var units: Array = units_value as Array
	var positions: Dictionary = positions_value as Dictionary
	var playback_seconds: float = float(state.get("playback_seconds", 0.0))
	for raw_unit: Variant in units:
		if not (raw_unit is Dictionary):
			continue
		var unit: Dictionary = raw_unit as Dictionary
		var unit_id: String = str(unit.get("id", ""))
		if not positions.has(unit_id):
			continue
		_draw_unit_emissive(unit, positions[unit_id] as Vector2, playback_seconds)
	_draw_authored_effects(state, positions)


func _draw_unit_emissive(unit: Dictionary, position: Vector2, playback_seconds: float) -> void:
	var unit_id: String = str(unit.get("id", ""))
	var role: String = str(unit.get("role", "QUEUE"))
	var party_side: bool = str(unit.get("side", "enemy")) == "party"
	var facing: float = -1.0 if party_side else 1.0
	var scale_value: float = float(unit.get("scale", 1.0))
	var accent: Color = Color(str(unit.get("accent", "#ffffff")))
	var base: Vector2 = _unit_base(unit_id, position, playback_seconds)
	draw_rect(Rect2(base + Vector2(-12.0, -82.0) * scale_value, Vector2(24.0, 7.0) * scale_value), accent)
	draw_rect(Rect2(base + Vector2(-14.0, -147.0) * scale_value, Vector2(28.0, 5.0) * scale_value), accent.lightened(0.23))
	draw_circle(base + Vector2(0.0, -78.5) * scale_value, 7.0 * scale_value, Color(accent, 0.18))
	_draw_emissive_weapon(base + Vector2(0.0, -80.0) * scale_value, role, facing, scale_value, accent)


func _draw_emissive_weapon(center: Vector2, role: String, facing: float, scale_value: float, accent: Color) -> void:
	var hand: Vector2 = center + Vector2(45.0 * facing, 6.0) * scale_value
	if role == "POWER":
		var heavy_tip: Vector2 = hand + Vector2(80.0 * facing, -46.0) * scale_value
		draw_line(hand, heavy_tip, Color(accent, 0.72), 3.0 * scale_value, true)
	elif role == "CRITICAL":
		for offset: float in [-9.0, 9.0]:
			var start: Vector2 = hand + Vector2(0.0, offset) * scale_value
			var twin_tip: Vector2 = start + Vector2(64.0 * facing, -23.0 + offset * 0.35) * scale_value
			draw_line(start, twin_tip, Color(accent, 0.75), 1.7 * scale_value, true)
	else:
		var queue_tip: Vector2 = hand + Vector2(70.0 * facing, -32.0) * scale_value
		draw_line(hand, queue_tip, Color(accent, 0.78), 2.0 * scale_value, true)


func _draw_authored_effects(state: Dictionary, positions: Dictionary) -> void:
	var events_value: Variant = state.get("events", [])
	if not (events_value is Array):
		return
	var playback_seconds: float = float(state.get("playback_seconds", 0.0))
	for raw_event: Variant in events_value as Array:
		if not (raw_event is Dictionary):
			continue
		var event: Dictionary = raw_event as Dictionary
		var progress: float = _event_progress_at(event, playback_seconds)
		if progress < 0.0 or progress > 1.0:
			continue
		var event_type: String = str(event.get("type", ""))
		if event_type == "melee":
			_draw_melee_effect(event, positions, playback_seconds)
		elif event_type == "disruptor":
			_draw_disruptor_effect(event, positions, playback_seconds)


func _draw_melee_effect(event: Dictionary, positions: Dictionary, playback_seconds: float) -> void:
	var contact_progress: float = _contact_progress_at(event, playback_seconds)
	if contact_progress < 0.0 or contact_progress > 1.0:
		return
	var target_id: String = str(event.get("target", ""))
	if not positions.has(target_id):
		return
	var target: Vector2 = (positions[target_id] as Vector2) + Vector2(0.0, -92.0)
	var alpha: float = sin(contact_progress * PI)
	draw_arc(target, 60.0 + contact_progress * 28.0, -2.3, 0.7, 36, Color(UI_GOLD, alpha), 10.0, true)
	draw_arc(target, 55.0 + contact_progress * 20.0, -2.3, 0.7, 36, Color(UI_WHITE, alpha), 2.5, true)
	for spark_index: int in range(10):
		var angle: float = -1.5 + float(spark_index) * 0.34
		var distance: float = contact_progress * (34.0 + float(spark_index % 4) * 15.0)
		draw_line(target, target + Vector2(cos(angle), sin(angle)) * distance, Color(UI_GOLD, alpha * 0.8), 2.2, true)


func _draw_disruptor_effect(event: Dictionary, positions: Dictionary, playback_seconds: float) -> void:
	var actor_id: String = str(event.get("actor", ""))
	var target_id: String = str(event.get("target", ""))
	if not positions.has(actor_id) or not positions.has(target_id):
		return
	var source: Vector2 = (positions[actor_id] as Vector2) + Vector2(0.0, -96.0)
	var target: Vector2 = (positions[target_id] as Vector2) + Vector2(0.0, -92.0)
	var elapsed: float = playback_seconds - float(event.get("at", 0.0))
	var contact_after: float = float(event.get("contactAfter", 0.46))
	if elapsed < 0.22:
		var charge: float = clampf(elapsed / 0.22, 0.0, 1.0)
		for ring_index: int in range(3):
			draw_arc(source, 18.0 + float(ring_index) * 14.0 + charge * 8.0, charge * TAU, charge * TAU + PI * 1.4, 34, Color(DISRUPTOR_GREEN, 0.58 - float(ring_index) * 0.10), 4.0, true)
		draw_circle(source, 7.0 + charge * 8.0, Color(0.82, 1.0, 0.90, 0.86))
	elif elapsed < contact_after:
		var beam_progress: float = clampf((elapsed - 0.22) / maxf(0.001, contact_after - 0.22), 0.0, 1.0)
		var beam_end: Vector2 = source.lerp(target, smoothstep(0.0, 1.0, beam_progress))
		draw_line(source, beam_end, Color(0.12, 0.95, 0.58, 0.18), 25.0, true)
		draw_line(source, beam_end, Color(DISRUPTOR_GREEN, 0.72), 9.0, true)
		draw_line(source, beam_end, UI_WHITE, 2.0, true)
	else:
		var duration: float = maxf(contact_after + 0.001, float(event.get("duration", 0.54)))
		var impact: float = clampf((elapsed - contact_after) / maxf(0.001, duration - contact_after), 0.0, 1.0)
		for ring_index: int in range(4):
			var radius: float = 22.0 + impact * (72.0 + float(ring_index) * 20.0)
			draw_arc(target, radius, 0.0, TAU, 48, Color(DISRUPTOR_GREEN, (1.0 - impact) * (0.64 - float(ring_index) * 0.10)), 6.0, true)


func _draw_foreground_occluders(state: Dictionary) -> void:
	# Cached soft-edge proxy: layered translucent geometry, never a per-frame blur.
	if bool(state.get("diagnostic_mosaic", false)):
		draw_rect(Rect2(Vector2.ZERO, DESIGN_SIZE), Color("#29333f"))
	for softness_index: int in range(7, -1, -1):
		var spread: float = float(softness_index) * 17.0
		var alpha: float = 0.032 + float(7 - softness_index) * 0.035
		draw_colored_polygon(PackedVector2Array([
			Vector2(-55.0 - spread, 810.0 - spread), Vector2(135.0 + spread, 885.0 - spread * 0.25),
			Vector2(240.0 + spread, 1080.0), Vector2(-55.0 - spread, 1080.0),
		]), Color(0.005, 0.008, 0.015, alpha))
		draw_colored_polygon(PackedVector2Array([
			Vector2(1975.0 + spread, 810.0 - spread), Vector2(1785.0 - spread, 885.0 - spread * 0.25),
			Vector2(1680.0 - spread, 1080.0), Vector2(1975.0 + spread, 1080.0),
		]), Color(0.005, 0.008, 0.015, alpha))


func _draw_half_resolution_post(state: Dictionary) -> void:
	# This node is rendered only inside the fixed 960x540 SubViewport.
	if bool(state.get("diagnostic_mosaic", false)):
		draw_rect(Rect2(Vector2.ZERO, HALF_SIZE), Color(0.015, 0.025, 0.045, 0.94))
	draw_rect(Rect2(Vector2.ZERO, HALF_SIZE), Color(0.015, 0.035, 0.080, 0.13))
	var warm_shaft: PackedVector2Array = PackedVector2Array([
		Vector2(765.0, 0.0), Vector2(915.0, 0.0),
		Vector2(750.0, 510.0), Vector2(575.0, 510.0),
	])
	draw_colored_polygon(warm_shaft, Color(1.0, 0.65, 0.24, 0.055))
	_draw_half_resolution_bloom(state)
	for edge_index: int in range(9):
		var alpha: float = 0.020 + float(edge_index) * 0.008
		var inset: float = float(edge_index) * 8.0
		draw_rect(Rect2(inset, inset, HALF_SIZE.x - inset * 2.0, HALF_SIZE.y - inset * 2.0), Color(0.0, 0.0, 0.03, alpha), false, 11.0)


func _draw_half_resolution_bloom(state: Dictionary) -> void:
	var units_value: Variant = state.get("units", [])
	var positions_value: Variant = state.get("positions", {})
	if not (units_value is Array) or not (positions_value is Dictionary):
		return
	var units: Array = units_value as Array
	var positions: Dictionary = positions_value as Dictionary
	var playback_seconds: float = float(state.get("playback_seconds", 0.0))
	for raw_unit: Variant in units:
		if not (raw_unit is Dictionary):
			continue
		var unit: Dictionary = raw_unit as Dictionary
		var unit_id: String = str(unit.get("id", ""))
		if not positions.has(unit_id):
			continue
		var accent: Color = Color(str(unit.get("accent", "#ffffff")))
		var base: Vector2 = _unit_base(unit_id, positions[unit_id] as Vector2, playback_seconds) * 0.5
		for glow_index: int in range(4, 0, -1):
			var radius: float = 5.0 + float(glow_index) * 5.0
			var alpha: float = 0.012 + float(5 - glow_index) * 0.009
			draw_circle(base + Vector2(0.0, -40.0), radius, Color(accent, alpha))
	var events_value: Variant = state.get("events", [])
	if not (events_value is Array):
		return
	for raw_event: Variant in events_value as Array:
		if not (raw_event is Dictionary):
			continue
		var event: Dictionary = raw_event as Dictionary
		var event_progress: float = _event_progress_at(event, playback_seconds)
		if event_progress < 0.0 or event_progress > 1.0:
			continue
		var target_id: String = str(event.get("target", ""))
		if not positions.has(target_id):
			continue
		var target: Vector2 = ((positions[target_id] as Vector2) + Vector2(0.0, -92.0)) * 0.5
		if str(event.get("type", "")) == "melee":
			var contact: float = _contact_progress_at(event, playback_seconds)
			if contact >= 0.0 and contact <= 1.0:
				var energy: float = sin(contact * PI)
				draw_circle(target, 46.0 + contact * 18.0, Color(UI_GOLD, energy * 0.12))
		elif str(event.get("type", "")) == "disruptor":
			var actor_id: String = str(event.get("actor", ""))
			if not positions.has(actor_id):
				continue
			var source: Vector2 = ((positions[actor_id] as Vector2) + Vector2(0.0, -96.0)) * 0.5
			var elapsed: float = playback_seconds - float(event.get("at", 0.0))
			var contact_after: float = float(event.get("contactAfter", 0.46))
			if elapsed < 0.22:
				draw_circle(source, 24.0 + clampf(elapsed / 0.22, 0.0, 1.0) * 10.0, Color(DISRUPTOR_GREEN, 0.15))
			elif elapsed < contact_after:
				var beam_progress: float = clampf((elapsed - 0.22) / maxf(0.001, contact_after - 0.22), 0.0, 1.0)
				var beam_end: Vector2 = source.lerp(target, smoothstep(0.0, 1.0, beam_progress))
				draw_line(source, beam_end, Color(DISRUPTOR_GREEN, 0.13), 24.0, true)
			else:
				var duration: float = maxf(contact_after + 0.001, float(event.get("duration", 0.54)))
				var impact: float = clampf((elapsed - contact_after) / maxf(0.001, duration - contact_after), 0.0, 1.0)
				draw_circle(target, 35.0 + impact * 42.0, Color(DISRUPTOR_GREEN, (1.0 - impact) * 0.15))


func _draw_ui(state: Dictionary) -> void:
	var font: Font = ThemeDB.fallback_font
	draw_rect(Rect2(0.0, 0.0, DESIGN_SIZE.x, 74.0), Color(0.003, 0.008, 0.020, 0.92))
	draw_line(Vector2(0.0, 74.0), Vector2(DESIGN_SIZE.x, 74.0), Color(UI_CYAN, 0.45), 1.0)
	draw_string(font, Vector2(30.0, 31.0), "GODOT NINE-LAYER COMPOSITOR PROOF", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 21, UI_WHITE)
	draw_string(font, Vector2(30.0, 56.0), "DETERMINISTIC STATE  •  UNAPPROVED BACKGROUNDS REMAIN NEUTRAL", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_CYAN)
	draw_string(font, Vector2(1570.0, 31.0), str(state.get("mode_label", "BACKGROUND A")), HORIZONTAL_ALIGNMENT_RIGHT, 318.0, 20, UI_GOLD)
	draw_string(font, Vector2(1570.0, 56.0), "NO WINNER SELECTED", HORIZONTAL_ALIGNMENT_RIGHT, 318.0, 12, UI_MUTED)
	draw_rect(Rect2(590.0, 91.0, 740.0, 42.0), Color(0.003, 0.008, 0.020, 0.78))
	draw_string(font, Vector2(610.0, 119.0), str(state.get("active_label", "IDENTICAL STATE")), HORIZONTAL_ALIGNMENT_CENTER, 700.0, 15, UI_WHITE)
	if bool(state.get("show_telemetry", true)):
		_draw_metrics_panel(font, state)
		_draw_contract_panel(font, state)
	if bool(state.get("show_review_overlay", true)):
		_draw_scope_panel(font)
	var load_error: String = str(state.get("load_error", ""))
	if not load_error.is_empty():
		draw_rect(Rect2(280.0, 430.0, 1360.0, 160.0), Color(0.20, 0.02, 0.04, 0.96))
		draw_string(font, Vector2(330.0, 485.0), "A/B HARNESS LOAD FAILED", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 27, Color("#fda4af"))
		draw_string(font, Vector2(330.0, 535.0), load_error, HORIZONTAL_ALIGNMENT_LEFT, 1260.0, 16, UI_WHITE)


func _draw_metrics_panel(font: Font, state: Dictionary) -> void:
	var metrics_value: Variant = state.get("frame_metrics", {})
	var metrics: Dictionary = metrics_value as Dictionary if metrics_value is Dictionary else {}
	var visibility_value: Variant = state.get("layer_visibility", [])
	var visibility: Array = visibility_value as Array if visibility_value is Array else []
	draw_rect(Rect2(28.0, 148.0, 782.0, 158.0), Color(0.003, 0.008, 0.020, 0.88))
	draw_rect(Rect2(28.0, 148.0, 4.0, 158.0), UI_CYAN)
	draw_string(font, Vector2(49.0, 179.0), "PROCESS DELTA  avg %.2f  p95 %.2f  max %.2f ms  •  TIME %.3f / %.1f" % [
		float(metrics.get("average_ms", 0.0)), float(metrics.get("p95_ms", 0.0)), float(metrics.get("max_ms", 0.0)),
		float(state.get("playback_seconds", 0.0)), float(state.get("loop_duration", 12.0)),
	], HORIZONTAL_ALIGNMENT_LEFT, -1.0, 14, UI_WHITE)
	draw_string(font, Vector2(49.0, 208.0), "LAYER MASK %s  •  F1-F9 toggle  •  F10 restore  •  D diagnostic mosaic" % _layer_mask(visibility), HORIZONTAL_ALIGNMENT_LEFT, -1.0, 14, UI_MUTED)
	draw_string(font, Vector2(49.0, 237.0), "TAB A/B  •  1 A  •  2 B  •  S split  •  SPACE pause  •  R restart" , HORIZONTAL_ALIGNMENT_LEFT, -1.0, 14, UI_MUTED)
	draw_string(font, Vector2(49.0, 266.0), "T telemetry  •  O scope overlay  •  scheduler delta is not a GPU profile", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_GOLD)
	draw_string(font, Vector2(49.0, 292.0), "Cached: 01/02/03/07  •  per-frame: 04/05/06/08  •  UI: outside post", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_CYAN)


func _draw_contract_panel(font: Font, state: Dictionary) -> void:
	draw_rect(Rect2(1050.0, 148.0, 842.0, 158.0), Color(0.003, 0.008, 0.020, 0.88))
	draw_rect(Rect2(1888.0, 148.0, 4.0, 158.0), UI_GOLD)
	draw_string(font, Vector2(1073.0, 179.0), "CONTRACT 01>02>03>04>05>06>07>08>09", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 14, UI_GOLD)
	draw_string(font, Vector2(1073.0, 208.0), "STAR  •  FAR  •  FLOOR  •  ENEMY  •  PARTY  •  EMISSIVE", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_WHITE)
	draw_string(font, Vector2(1073.0, 237.0), "FOREGROUND  •  POST 960x540  •  UI CanvasLayer 100", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_WHITE)
	draw_string(font, Vector2(1073.0, 266.0), "Post viewport = 25% of design pixels; no full-resolution blur", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_CYAN)
	draw_string(font, Vector2(1073.0, 292.0), "Diagnostic=%s  •  background treatment identical" % ["MOSAIC" if bool(state.get("diagnostic_mosaic", false)) else "COMPOSITE"], HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_MUTED)


func _draw_scope_panel(font: Font) -> void:
	draw_rect(Rect2(560.0, 932.0, 800.0, 112.0), Color(0.003, 0.008, 0.020, 0.84))
	draw_rect(Rect2(560.0, 932.0, 800.0, 3.0), UI_GOLD)
	draw_string(font, Vector2(586.0, 966.0), "ARCHITECTURE PROOF ONLY  •  NO ART SELECTION OR INTEGRATION", HORIZONTAL_ALIGNMENT_CENTER, 748.0, 14, UI_GOLD)
	draw_string(font, Vector2(586.0, 994.0), "Flat unapproved A/B plates remain read-only; stand-ins and soft layers are procedural.", HORIZONTAL_ALIGNMENT_CENTER, 748.0, 13, UI_WHITE)
	draw_string(font, Vector2(586.0, 1022.0), "Developer visual approval remains pending.", HORIZONTAL_ALIGNMENT_CENTER, 748.0, 13, UI_MUTED)


func _layer_mask(visibility: Array) -> String:
	var mask: String = ""
	for layer_index: int in range(9):
		var enabled: bool = layer_index < visibility.size() and bool(visibility[layer_index])
		mask += str(layer_index + 1) if enabled else "-"
	return mask


func _unit_base(unit_id: String, position: Vector2, playback_seconds: float) -> Vector2:
	var phase: float = float(abs(unit_id.hash()) % 31) * 0.17
	var bob: float = sin(playback_seconds * 2.0 + phase) * 2.0
	return position + Vector2(0.0, bob)


func _event_progress_at(event: Dictionary, playback_seconds: float) -> float:
	var at: float = float(event.get("at", 0.0))
	var duration: float = maxf(0.001, float(event.get("duration", 1.0)))
	return (playback_seconds - at) / duration


func _contact_progress_at(event: Dictionary, playback_seconds: float) -> float:
	var at: float = float(event.get("at", 0.0))
	var contact_after: float = float(event.get("contactAfter", 0.0))
	var duration: float = maxf(contact_after + 0.001, float(event.get("duration", 1.0)))
	return (playback_seconds - at - contact_after) / maxf(0.001, duration - contact_after)


func _draw_ellipse_shape(center: Vector2, radii: Vector2, color: Color) -> void:
	var points: PackedVector2Array = PackedVector2Array()
	for point_index: int in range(30):
		var angle: float = TAU * float(point_index) / 30.0
		points.append(center + Vector2(cos(angle) * radii.x, sin(angle) * radii.y))
	draw_colored_polygon(points, color)
