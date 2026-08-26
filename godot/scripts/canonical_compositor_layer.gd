extends Node2D

const DESIGN_SIZE := Vector2(1920.0, 1080.0)
const HALF_SIZE := Vector2(960.0, 540.0)
const PARTY_BODY := Color("#214d57")
const ENEMY_BODY := Color("#443746")
const CYAN := Color("#63e6ff")
const GOLD := Color("#ffcf67")
const GREEN := Color("#53f2a8")
const MUTED := Color("#a7b3c4")
const UNIT_VISUAL_SCALE := 0.72

@export_range(1, 9, 1) var layer_number := 1

var controller: Node


func bind_controller(value: Node) -> void:
	controller = value
	queue_redraw()


func refresh() -> void:
	queue_redraw()


func get_layer_number() -> int:
	return layer_number


func _draw() -> void:
	var snapshot := _snapshot()
	if snapshot.is_empty():
		return
	match layer_number:
		1:
			_draw_starfield(snapshot)
		2:
			_draw_far_backdrop(snapshot)
		3:
			_draw_stage_floor(snapshot)
		4:
			_draw_unit_layer(snapshot, "enemy")
		5:
			_draw_unit_layer(snapshot, "party")
		6:
			_draw_emissive_pass(snapshot)
		7:
			_draw_foreground_occluders(snapshot)
		8:
			_draw_half_resolution_post(snapshot)
		9:
			_draw_interface(snapshot)


func _snapshot() -> Dictionary:
	if controller == null or not controller.has_method("render_snapshot"):
		return {}
	var value: Variant = controller.call("render_snapshot")
	return value as Dictionary if value is Dictionary else {}


func _draw_starfield(snapshot: Dictionary) -> void:
	var environment := _environment(snapshot)
	var shadow := _bridge_color(str(environment.get("shadowColor", "#080c14")), Color("#080c14"))
	var haze := _bridge_color(str(environment.get("hazeColor", "#25354a")), Color("#25354a"))
	for band in range(36):
		var ratio := float(band) / 35.0
		draw_rect(Rect2(0.0, ratio * 820.0, DESIGN_SIZE.x, 26.0), shadow.lerp(haze, ratio * 0.42))
	var particles := snapshot.get("ambient_particles", []) as Array
	for particle_value: Variant in particles:
		if not particle_value is Dictionary:
			continue
		var particle := particle_value as Dictionary
		var alpha := 0.12 + sin(float(particle.get("phase", 0.0))) * 0.035
		draw_circle(
			Vector2(float(particle.get("x", 0.0)), float(particle.get("y", 0.0))),
			float(particle.get("radius", 1.0)),
			Color(0.45, 0.84, 0.9, alpha)
		)


func _draw_far_backdrop(snapshot: Dictionary) -> void:
	if bool(snapshot.get("opening_mode", false)):
		_draw_virimonde_backdrop(snapshot)
		return
	var authored_texture := _environment_texture(snapshot, "far_backdrop")
	if authored_texture != null:
		draw_texture_rect(authored_texture, Rect2(Vector2.ZERO, DESIGN_SIZE), false, Color(0.78, 0.82, 0.9, 1.0))
		_draw_light_shafts(_environment(snapshot))
		return
	var environment := _environment(snapshot)
	var haze := _bridge_color(str(environment.get("hazeColor", "#25354a")), Color("#25354a"))
	var stone := _bridge_color(str(environment.get("stoneColor", "#343948")), Color("#343948"))
	var light := _bridge_color(str(environment.get("lightColor", "#ffe080")), Color("#ffe080"))
	draw_rect(Rect2(0.0, 465.0, DESIGN_SIZE.x, 310.0), Color(haze.darkened(0.46), 0.5))
	# A monumental but restrained Imperial deck: asymmetrical structural ribs,
	# distant wall bays, and one warm source instead of evenly spaced gray blocks.
	for bay in range(7):
		var bay_x := 100.0 + float(bay) * 286.0
		var bay_width := 188.0 if bay % 3 != 1 else 146.0
		var bay_top := 250.0 + float((bay * 43) % 105)
		draw_rect(Rect2(bay_x, bay_top, bay_width, 425.0), Color(stone.darkened(0.2), 0.56))
		draw_rect(Rect2(bay_x + 14.0, bay_top + 20.0, bay_width - 28.0, 370.0), Color(haze.darkened(0.34), 0.5))
		draw_line(Vector2(bay_x + 28.0, bay_top + 28.0), Vector2(bay_x + 28.0, 656.0), Color(haze.lightened(0.25), 0.2), 4.0)
		for slit in range(3):
			var slit_y := bay_top + 82.0 + float(slit) * 82.0
			draw_rect(Rect2(bay_x + bay_width - 30.0, slit_y, 5.0, 39.0), Color(light, 0.14 if bay == 3 else 0.055))
	for side_index in range(4):
		var inset := float(side_index) * 155.0
		var rib := PackedVector2Array([
			Vector2(inset - 80.0, 120.0),
			Vector2(inset + 18.0, 120.0),
			Vector2(inset + 250.0, 735.0),
			Vector2(inset + 194.0, 735.0),
		])
		draw_colored_polygon(rib, Color(stone.lightened(0.035), 0.55 - float(side_index) * 0.07))
		var mirrored := PackedVector2Array()
		for point in rib:
			mirrored.append(Vector2(DESIGN_SIZE.x - point.x, point.y))
		draw_colored_polygon(mirrored, Color(stone.lightened(0.035), 0.55 - float(side_index) * 0.07))
	# The broken central crown keeps the upper field open while giving the arena a focal axis.
	draw_arc(Vector2(960.0, 720.0), 348.0, PI + 0.18, TAU - 0.18, 64, Color(stone.lightened(0.04), 0.5), 34.0)
	draw_arc(Vector2(960.0, 720.0), 294.0, PI + 0.22, TAU - 0.22, 64, Color(haze.lightened(0.16), 0.2), 5.0)
	draw_line(Vector2(612.0, 720.0), Vector2(1308.0, 720.0), Color(light, 0.12), 3.0)
	_draw_light_shafts(environment)


func _draw_light_shafts(environment: Dictionary) -> void:
	var source := Vector2(
		float(environment.get("lightSourceX", 0.5)) * DESIGN_SIZE.x,
		float(environment.get("lightSourceY", 0.2)) * DESIGN_SIZE.y
	)
	var light := _bridge_color(str(environment.get("lightColor", "#ffe080")), Color("#ffe080"))
	var shaft := PackedVector2Array([
		source + Vector2(-115.0, -220.0),
		source + Vector2(115.0, -220.0),
		Vector2(source.x + 280.0, 835.0),
		Vector2(source.x - 430.0, 835.0),
	])
	draw_polygon(shaft, PackedColorArray([Color(light, 0.092)]))


func _draw_stage_floor(snapshot: Dictionary) -> void:
	if bool(snapshot.get("opening_mode", false)):
		_draw_virimonde_stage_floor(snapshot)
		if bool(snapshot.get("world_loop_mode", false)):
			_draw_world_loop_markers(snapshot)
		else:
			_draw_opening_traversal_marker(snapshot)
		return
	var authored_texture := _environment_texture(snapshot, "stage_floor")
	if authored_texture != null:
		draw_texture_rect(authored_texture, Rect2(Vector2.ZERO, DESIGN_SIZE), false, Color(0.92, 0.94, 1.0, 1.0))
		return
	var environment := _environment(snapshot)
	var floor_tint := _bridge_color(str(environment.get("floorTint", "#202530")), Color("#202530"))
	var metal := _bridge_color(str(environment.get("metalColor", "#252c3a")), Color("#252c3a"))
	var accent := _bridge_color(str(environment.get("accentColor", "#63e6ff")), CYAN)
	for band in range(10):
		var band_ratio := float(band) / 9.0
		draw_rect(Rect2(0.0, 748.0 + float(band) * 34.0, DESIGN_SIZE.x, 36.0), floor_tint.lerp(Color("#080c13"), band_ratio * 0.44))
	var vanishing := Vector2(960.0, 735.0)
	for index in range(13):
		var bottom_x := float(index) * 180.0 - 120.0
		draw_line(vanishing, Vector2(bottom_x, 1080.0), Color(metal.lightened(0.3), 0.22), 2.0)
	for row in range(7):
		var ratio := float(row) / 6.0
		var y := lerpf(772.0, 1080.0, pow(ratio, 1.55))
		draw_line(Vector2(0.0, y), Vector2(1920.0, y), Color(metal.lightened(0.26), 0.2), 2.0)
	# Long deck plates and a worn center inlay replace the prototype's bright grid.
	for lane in range(5):
		var lane_x := 126.0 + float(lane) * 420.0
		draw_line(Vector2(lane_x, 830.0), Vector2(lane_x + 115.0, 1045.0), Color(metal.lightened(0.2), 0.18), 5.0)
	draw_colored_polygon(PackedVector2Array([
		Vector2(810.0, 1080.0), Vector2(920.0, 750.0), Vector2(1000.0, 750.0), Vector2(1110.0, 1080.0)
	]), Color(metal.lightened(0.05), 0.26))
	draw_line(Vector2(0.0, 778.0), Vector2(1920.0, 778.0), Color(accent, 0.18), 2.0)
	draw_line(Vector2(0.0, 789.0), Vector2(1920.0, 789.0), Color(GOLD, 0.08), 1.0)


func _draw_unit_layer(snapshot: Dictionary, requested_side: String) -> void:
	var state := snapshot.get("state", {}) as Dictionary
	var positions := snapshot.get("positions", {}) as Dictionary
	var combatants := state.get("combatants", []) as Array
	var playback_seconds := float(snapshot.get("playback_seconds", 0.0))
	var opening_beat := snapshot.get("opening_beat", {}) as Dictionary
	var opening_objective := str(opening_beat.get("objectiveKey", ""))
	if (
		requested_side == "party"
		and bool(snapshot.get("opening_mode", false))
		and opening_objective in [
			"opening.escape_pod_crash",
			"opening.escape_pod_rescue",
		]
	):
		_draw_opening_rescue_target(playback_seconds)
	if (
		requested_side == "party"
		and bool(snapshot.get("opening_mode", false))
		and combatants.is_empty()
	):
		_draw_opening_party_travelers(snapshot, playback_seconds)
		return
	for item_value: Variant in combatants:
		if not item_value is Dictionary:
			continue
		var combatant := item_value as Dictionary
		if str(combatant.get("side", "enemy")) != requested_side:
			continue
		var combatant_id := str(combatant.get("id", ""))
		if not positions.has(combatant_id):
			continue
		var ground := positions[combatant_id] as Vector2
		draw_set_transform(ground, 0.0, Vector2(UNIT_VISUAL_SCALE, UNIT_VISUAL_SCALE))
		_draw_unit_body(Vector2.ZERO, combatant, playback_seconds)
		draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


func _draw_opening_traversal_marker(snapshot: Dictionary) -> void:
	if not bool(snapshot.get("opening_traversal_active", false)):
		return
	var marker: Vector2 = snapshot.get(
		"opening_traversal_target_position",
		Vector2(1010.0, 825.0)
	)
	var complete := bool(snapshot.get("opening_traversal_complete", false))
	var color := GREEN if complete else GOLD
	_draw_ellipse_shape(marker + Vector2(0.0, 9.0), Vector2(47.0, 14.0), Color(color, 0.18))
	draw_arc(marker + Vector2(0.0, 9.0), 47.0, 0.0, TAU, 48, Color(color, 0.88), 3.0)
	draw_line(marker + Vector2(0.0, -2.0), marker + Vector2(0.0, -72.0), Color(color, 0.36), 4.0)
	draw_circle(marker + Vector2(0.0, -78.0), 7.0, Color(color, 0.92))


func _draw_opening_party_travelers(snapshot: Dictionary, playback_seconds: float) -> void:
	var party := snapshot.get("opening_party", []) as Array
	if party.is_empty():
		return
	var beat := snapshot.get("opening_beat", {}) as Dictionary
	var objective_key := str(beat.get("objectiveKey", ""))
	if objective_key == "opening.death_order":
		_draw_standing_personnel(playback_seconds)
	if objective_key == "opening.familiar_virimonde":
		_draw_opening_supply_cache(snapshot)
	var lead_position: Vector2 = (
		snapshot.get("world_loop_player_position", Vector2(960.0, 910.0))
		if bool(snapshot.get("world_loop_mode", false))
		else _opening_noncombat_lead_position(snapshot, objective_key)
	)
	for member_index in range(party.size() - 1, -1, -1):
		var member_value: Variant = party[member_index]
		if typeof(member_value) != TYPE_DICTIONARY:
			continue
		var member := member_value as Dictionary
		var formation_offset := Vector2(-62.0 * float(member_index), 30.0 * float(member_index))
		_draw_opening_traveler(
			lead_position + formation_offset,
			member,
			member_index,
			playback_seconds
		)


func _draw_world_loop_markers(snapshot: Dictionary) -> void:
	if str(snapshot.get("live_awaiting", "")) != "explore":
		return
	var font := ThemeDB.fallback_font
	for marker_value: Variant in snapshot.get("world_loop_markers", []) as Array:
		if typeof(marker_value) != TYPE_DICTIONARY:
			continue
		var marker := marker_value as Dictionary
		var position: Vector2 = marker.get("position", Vector2(960.0, 890.0))
		var marker_type := str(marker.get("type", ""))
		var available := bool(marker.get("available", false))
		var nearby := bool(marker.get("nearby", false))
		var color := Color("#63e6ff")
		match marker_type:
			"chest": color = Color("#f0c56a")
			"encounter": color = Color("#ef7777")
			"rest": color = Color("#78d7a0")
			"shop": color = Color("#b69ae9")
			"travel": color = Color("#8fc7e8")
		if not available:
			color = Color(0.38, 0.43, 0.45, 0.46)
		var pulse := 1.0 + sin(float(snapshot.get("playback_seconds", 0.0)) * 3.0) * 0.08 if nearby else 1.0
		_draw_ellipse_shape(position + Vector2(0.0, 12.0), Vector2(45.0 * pulse, 13.0 * pulse), Color(color, 0.16))
		draw_arc(position + Vector2(0.0, 12.0), 43.0 * pulse, 0.0, TAU, 40, Color(color, 0.82), 2.5)
		draw_line(position + Vector2(0.0, 4.0), position + Vector2(0.0, -62.0), Color(color, 0.46), 3.0)
		var icon_position := position + Vector2(0.0, -74.0)
		if marker_type == "chest":
			draw_rect(Rect2(icon_position - Vector2(17.0, 10.0), Vector2(34.0, 21.0)), Color(color, 0.68))
			draw_rect(Rect2(icon_position - Vector2(19.0, 14.0), Vector2(38.0, 9.0)), Color(color, 0.9))
		elif marker_type == "encounter":
			draw_colored_polygon(PackedVector2Array([
				icon_position + Vector2(0.0, -20.0),
				icon_position + Vector2(18.0, 17.0),
				icon_position + Vector2(-18.0, 17.0),
			]), Color(color, 0.88))
		elif marker_type == "rest":
			draw_circle(icon_position, 18.0, Color(color, 0.78))
			draw_line(icon_position + Vector2(-10.0, 0.0), icon_position + Vector2(10.0, 0.0), Color("#071b16"), 4.0)
			draw_line(icon_position + Vector2(0.0, -10.0), icon_position + Vector2(0.0, 10.0), Color("#071b16"), 4.0)
		elif marker_type == "shop":
			draw_rect(Rect2(icon_position - Vector2(17.0, 17.0), Vector2(34.0, 34.0)), Color(color, 0.72), false, 3.0)
			draw_circle(icon_position, 6.0, Color(color, 0.86))
		else:
			draw_colored_polygon(PackedVector2Array([
				icon_position + Vector2(-19.0, -15.0),
				icon_position + Vector2(19.0, 0.0),
				icon_position + Vector2(-19.0, 15.0),
			]), Color(color, 0.86))
		var label := str(marker.get("label", ""))
		var label_width := clampf(float(label.length()) * 10.0 + 30.0, 120.0, 240.0)
		var label_rect := Rect2(position.x - label_width * 0.5, position.y - 132.0, label_width, 30.0)
		draw_rect(label_rect, Color(0.002, 0.008, 0.014, 0.62 if nearby else 0.38))
		draw_rect(label_rect, Color(color, 0.82 if nearby else 0.44), false, 1.0)
		draw_string(font, label_rect.position + Vector2(10.0, 21.0), label, HORIZONTAL_ALIGNMENT_CENTER, label_rect.size.x - 20.0, 13, Color.WHITE if available else Color(0.6, 0.64, 0.65, 0.72))


func _opening_noncombat_lead_position(snapshot: Dictionary, objective_key: String) -> Vector2:
	if bool(snapshot.get("opening_traversal_active", false)):
		return snapshot.get("opening_traversal_position", Vector2(360.0, 930.0))
	match objective_key:
		"opening.standing_escape": return Vector2(520.0, 920.0)
		"opening.flyer_last_stand": return Vector2(760.0, 900.0)
		"opening.escape_pod_crash": return Vector2(1230.0, 900.0)
		"opening.lake_recovery": return Vector2(760.0, 910.0)
		"opening.yacht_safety": return Vector2(1150.0, 900.0)
		_: return Vector2(360.0, 930.0)


func _draw_opening_rescue_target(playback_seconds: float) -> void:
	var ground := Vector2(1450.0, 900.0)
	var bob := sin(playback_seconds * 2.0) * 1.0
	_draw_opening_traveler(
		ground + Vector2(0.0, bob),
		{"id": "owen"},
		1,
		playback_seconds * 0.25
	)
	draw_arc(ground + Vector2(0.0, 8.0), 43.0, 0.0, TAU, 40, Color("#d65a46"), 3.0)


func _draw_standing_personnel(playback_seconds: float) -> void:
	var positions: Array[Vector2] = [
		Vector2(1105.0, 820.0),
		Vector2(1028.0, 786.0),
		Vector2(1182.0, 854.0),
	]
	for personnel_index in range(positions.size() - 1, -1, -1):
		var ground := positions[personnel_index]
		var bob := sin(playback_seconds * 2.2 + float(personnel_index)) * 1.2
		var base := ground + Vector2(0.0, bob)
		var coat := Color("#30383d").lightened(float(personnel_index) * 0.025)
		_draw_ellipse_shape(base + Vector2(0.0, 11.0), Vector2(28.0, 8.0), Color(0.0, 0.0, 0.0, 0.5))
		draw_line(base + Vector2(-8.0, -4.0), base + Vector2(-10.0, 14.0), Color("#161b20"), 7.0)
		draw_line(base + Vector2(8.0, -4.0), base + Vector2(10.0, 14.0), Color("#161b20"), 7.0)
		draw_colored_polygon(PackedVector2Array([
			base + Vector2(-18.0, -57.0),
			base + Vector2(15.0, -57.0),
			base + Vector2(22.0, -4.0),
			base + Vector2(-20.0, -4.0),
		]), coat)
		draw_line(base + Vector2(-8.0, -43.0), base + Vector2(-32.0, -21.0), coat.lightened(0.08), 8.0)
		draw_line(base + Vector2(9.0, -43.0), base + Vector2(31.0, -28.0), coat.lightened(0.08), 8.0)
		draw_circle(base + Vector2(-1.0, -72.0), 14.0, Color("#b69274"))
		draw_rect(Rect2(base + Vector2(-18.0, -37.0), Vector2(34.0, 6.0)), Color("#8f2f2d"))
		draw_circle(base + Vector2(-1.0, -34.0), 3.0, Color("#e05a45"))


func _draw_opening_supply_cache(snapshot: Dictionary) -> void:
	var marker: Vector2 = snapshot.get("opening_traversal_end", Vector2(1010.0, 825.0))
	var base := marker + Vector2(-78.0, 7.0)
	var inspected := bool(snapshot.get("opening_supplies_inspected", false))
	var accent := GREEN if inspected else GOLD
	_draw_ellipse_shape(base + Vector2(0.0, 17.0), Vector2(45.0, 9.0), Color(0.0, 0.0, 0.0, 0.48))
	draw_rect(Rect2(base + Vector2(-35.0, -28.0), Vector2(70.0, 43.0)), Color("#493526"))
	draw_rect(Rect2(base + Vector2(-35.0, -28.0), Vector2(70.0, 43.0)), Color("#8d7550"), false, 3.0)
	draw_rect(Rect2(base + Vector2(-29.0, -22.0), Vector2(58.0, 7.0)), Color("#2b3336"))
	draw_rect(Rect2(base + Vector2(-5.0, -16.0), Vector2(10.0, 27.0)), Color("#a99261"))
	draw_circle(base + Vector2(0.0, -2.0), 4.0, Color(accent, 0.94))
	draw_rect(Rect2(base + Vector2(22.0, -43.0), Vector2(26.0, 18.0)), Color("#52674c"))
	draw_line(base + Vector2(22.0, -34.0), base + Vector2(48.0, -34.0), Color("#a9b890"), 3.0)
	draw_string(
		ThemeDB.fallback_font,
		base + Vector2(-52.0, -54.0),
		"SUPPLIES",
		HORIZONTAL_ALIGNMENT_CENTER,
		104.0,
		12,
		Color(accent, 0.92)
	)


func _draw_opening_traveler(
	ground: Vector2,
	member: Dictionary,
	member_index: int,
	playback_seconds: float
) -> void:
	var member_id := str(member.get("id", ""))
	var is_hazel := member_id == "hazel"
	var phase := playback_seconds * 4.8 + float(member_index) * 0.8
	var bob := sin(phase) * 2.0
	var stride := sin(phase) * 6.0
	var base := ground + Vector2(0.0, bob)
	var coat := Color("#19747a") if is_hazel else Color("#285eb0")
	var coat_shadow := Color("#0d4148") if is_hazel else Color("#1a326f")
	var accent := Color("#ece6ce") if is_hazel else Color("#e4e8ed")
	var secondary := Color("#33a782") if is_hazel else Color("#3d87ca")
	var hair := Color("#a6422f") if is_hazel else Color("#e2c36b")
	_draw_ellipse_shape(base + Vector2(0.0, 13.0), Vector2(39.0, 10.0), Color(0.0, 0.0, 0.0, 0.3))
	_draw_ellipse_shape(base + Vector2(0.0, 11.0), Vector2(28.0, 6.0), Color(0.02, 0.08, 0.09, 0.22))
	draw_line(base + Vector2(-9.0, -6.0), base + Vector2(-12.0 + stride, 15.0), Color("#141d29"), 9.0)
	draw_line(base + Vector2(9.0, -6.0), base + Vector2(12.0 - stride, 15.0), Color("#141d29"), 9.0)
	draw_line(base + Vector2(-12.0 + stride, 14.0), base + Vector2(-22.0 + stride, 14.0), Color("#0b1119"), 7.0)
	draw_line(base + Vector2(12.0 - stride, 14.0), base + Vector2(22.0 - stride, 14.0), Color("#0b1119"), 7.0)
	draw_colored_polygon(PackedVector2Array([
		base + Vector2(-23.0, -65.0),
		base + Vector2(19.0, -65.0),
		base + Vector2(30.0, -8.0),
		base + Vector2(18.0, 5.0),
		base + Vector2(1.0, -8.0),
		base + Vector2(-17.0, 5.0),
		base + Vector2(-28.0, -8.0),
	]), coat_shadow)
	draw_colored_polygon(PackedVector2Array([
		base + Vector2(-18.0, -63.0),
		base + Vector2(16.0, -63.0),
		base + Vector2(20.0, -15.0),
		base + Vector2(-18.0, -15.0),
	]), coat)
	draw_colored_polygon(PackedVector2Array([
		base + Vector2(-19.0, -60.0), base + Vector2(-3.0, -60.0),
		base + Vector2(1.0, -18.0), base + Vector2(-12.0, -18.0),
	]), Color(secondary, 0.82))
	draw_line(base + Vector2(-21.0, -53.0), base + Vector2(-33.0, -18.0 - stride * 0.35), coat.lightened(0.08), 10.0)
	draw_line(base + Vector2(18.0, -53.0), base + Vector2(33.0, -19.0 + stride * 0.35), coat.lightened(0.08), 10.0)
	draw_line(base + Vector2(-17.0, -59.0), base + Vector2(15.0, -59.0), Color(accent, 0.72), 4.0)
	draw_rect(Rect2(base + Vector2(-19.0, -40.0), Vector2(39.0, 7.0)), Color("#18242d"))
	draw_rect(Rect2(base + Vector2(-6.0, -40.0), Vector2(12.0, 7.0)), Color(accent, 0.86))
	draw_line(base + Vector2(2.0, -57.0), base + Vector2(4.0, -18.0), Color(accent, 0.68), 3.0)
	draw_circle(base + Vector2(0.0, -82.0), 17.0, Color("#d7b08c"))
	draw_arc(base + Vector2(0.0, -84.0), 17.0, PI + 0.1, TAU - 0.05, 18, hair, 10.0)
	if is_hazel:
		draw_line(base + Vector2(-13.0, -82.0), base + Vector2(-18.0, -50.0), hair.darkened(0.08), 8.0)
		draw_circle(base + Vector2(7.0, -82.0), 2.0, Color("#6ad7a6"))
	draw_circle(base + Vector2(18.0, -39.0), 5.0, Color(secondary, 0.92))
	draw_string(
		ThemeDB.fallback_font,
		base + Vector2(-54.0, -111.0),
		str(member.get("name", member_id)),
		HORIZONTAL_ALIGNMENT_CENTER,
		108.0,
		13,
		Color(0.94, 0.96, 0.98, 0.88)
	)


func _draw_unit_body(position: Vector2, combatant: Dictionary, playback_seconds: float) -> void:
	var side := str(combatant.get("side", "enemy"))
	var slot := int(combatant.get("slot", 0))
	var body := PARTY_BODY if side == "party" else ENEMY_BODY
	var accent := _bridge_color(str(combatant.get("accentColor", "#63e6ff")), CYAN)
	var alive := bool(combatant.get("alive", true))
	if not alive:
		body = body.darkened(0.62)
		accent = accent.darkened(0.62)
	var phase := playback_seconds * 1.85 + float(slot) * 0.77 + (0.0 if side == "party" else 0.33)
	var bob := sin(phase) * 2.5 if alive else 0.0
	var breath := sin(phase * 0.72) * 1.8 if alive else 0.0
	var base := position + Vector2(0.0, bob)
	var facing := -1.0 if side == "party" else 1.0
	var lean := 7.0 * facing if slot == 1 else 0.0
	var upper := base + Vector2(lean, breath)
	var shoulder_width: float = [58.0, 45.0, 51.0][slot] if slot >= 0 and slot <= 2 else 50.0
	var torso_width: float = [40.0, 31.0, 35.0][slot] if slot >= 0 and slot <= 2 else 35.0
	var stance_width: float = [37.0, 29.0, 33.0][slot] if slot >= 0 and slot <= 2 else 33.0
	var coat_color := body.lerp(accent.darkened(0.3), 0.18 if side == "party" else 0.1)
	var armor_color := body.lightened(0.2 if side == "party" else 0.12)
	var shadow_width := 69.0 if slot == 0 else 56.0 if slot == 1 else 62.0
	_draw_ellipse_shape(base + Vector2(0.0, 24.0), Vector2(shadow_width, 13.0), Color(0.0, 0.0, 0.0, 0.58))
	# Shared construction stays human-scale while role proportions change the silhouette.
	draw_polygon(PackedVector2Array([
		upper + Vector2(-torso_width + 4.0, -99.0), upper + Vector2(torso_width - 3.0, -99.0),
		base + Vector2(torso_width + (14.0 if slot == 2 else 8.0), 4.0),
		base + Vector2(7.0, -12.0), base + Vector2(-torso_width - (6.0 if slot == 1 else 11.0), 5.0),
	]), PackedColorArray([coat_color.darkened(0.22)]))
	if slot == 1:
		draw_polygon(PackedVector2Array([
			upper + Vector2(-torso_width, -93.0), upper + Vector2(-7.0, -86.0),
			base + Vector2(-12.0, 8.0), base + Vector2(-46.0, 1.0),
		]), PackedColorArray([coat_color.darkened(0.1)]))
	draw_polygon(PackedVector2Array([
		base + Vector2(-stance_width + 7.0, -43.0), base + Vector2(-4.0, -43.0),
		base + Vector2(-9.0, 18.0), base + Vector2(-stance_width, 18.0),
	]), PackedColorArray([body.darkened(0.34)]))
	draw_polygon(PackedVector2Array([
		base + Vector2(4.0, -43.0), base + Vector2(stance_width - 7.0, -43.0),
		base + Vector2(stance_width, 18.0), base + Vector2(8.0, 18.0),
	]), PackedColorArray([body.darkened(0.28)]))
	draw_rect(Rect2(base.x - stance_width - 2.0, base.y + 12.0, stance_width - 4.0, 11.0), Color("#111722"))
	draw_rect(Rect2(base.x + 7.0, base.y + 12.0, stance_width - 4.0, 11.0), Color("#111722"))
	draw_polygon(PackedVector2Array([
		upper + Vector2(-torso_width, -112.0), upper + Vector2(-torso_width + 13.0, -132.0),
		upper + Vector2(torso_width - 13.0, -132.0), upper + Vector2(torso_width, -110.0),
		upper + Vector2(torso_width - 10.0, -48.0), upper + Vector2(-torso_width + 10.0, -48.0),
	]), PackedColorArray([body]))
	draw_polygon(PackedVector2Array([
		upper + Vector2(-torso_width + 12.0, -113.0), upper + Vector2(torso_width - 12.0, -113.0),
		upper + Vector2(torso_width - 16.0, -68.0), upper + Vector2(-torso_width + 16.0, -68.0),
	]), PackedColorArray([armor_color]))
	draw_line(upper + Vector2(-torso_width + 16.0, -91.0), upper + Vector2(torso_width - 16.0, -91.0), Color(accent, 0.78), 3.0)
	draw_polygon(PackedVector2Array([
		upper + Vector2(-shoulder_width, -112.0), upper + Vector2(-torso_width + 11.0, -129.0),
		upper + Vector2(-torso_width + 17.0, -106.0), upper + Vector2(-shoulder_width + 8.0, -96.0),
	]), PackedColorArray([armor_color.darkened(0.03)]))
	draw_polygon(PackedVector2Array([
		upper + Vector2(shoulder_width, -112.0), upper + Vector2(torso_width - 11.0, -129.0),
		upper + Vector2(torso_width - 17.0, -106.0), upper + Vector2(shoulder_width - 8.0, -96.0),
	]), PackedColorArray([armor_color.darkened(0.03)]))
	if slot == 2:
		draw_polygon(PackedVector2Array([
			upper + Vector2(-facing * 22.0, -133.0), upper + Vector2(-facing * 57.0, -143.0),
			upper + Vector2(-facing * 62.0, -109.0), upper + Vector2(-facing * 30.0, -105.0),
		]), PackedColorArray([armor_color.lightened(0.08)]))
	draw_line(upper + Vector2(-shoulder_width + 8.0, -101.0), upper + Vector2(-torso_width, -52.0), body.darkened(0.24), 13.0)
	draw_line(upper + Vector2(shoulder_width - 8.0, -101.0), upper + Vector2(torso_width, -53.0), body.darkened(0.24), 13.0)
	_draw_unit_head(upper, side, slot, body, accent)
	draw_rect(Rect2(upper.x - torso_width + 8.0, upper.y - 59.0, torso_width * 2.0 - 16.0, 8.0), Color("#151d29"))
	_draw_unit_weapon(upper, side, slot, facing, accent)
	var rim_side := 1.0 if position.x < DESIGN_SIZE.x * 0.5 else -1.0
	draw_line(
		upper + Vector2(rim_side * (shoulder_width - 5.0), -116.0),
		upper + Vector2(rim_side * (torso_width - 3.0), -72.0),
		Color("#ffe8a8", 0.2), 2.0
	)


func _draw_unit_head(base: Vector2, side: String, slot: int, body: Color, accent: Color) -> void:
	if side == "enemy":
		draw_polygon(PackedVector2Array([
			base + Vector2(-22.0, -161.0), base + Vector2(-14.0, -180.0),
			base + Vector2(15.0, -180.0), base + Vector2(23.0, -159.0),
			base + Vector2(12.0, -136.0), base + Vector2(-13.0, -136.0),
		]), PackedColorArray([Color("#746872").lerp(body, 0.35)]))
		draw_polygon(PackedVector2Array([
			base + Vector2(-22.0, -164.0), base + Vector2(-8.0, -187.0),
			base + Vector2(18.0, -175.0), base + Vector2(23.0, -158.0),
		]), PackedColorArray([body.darkened(0.48)]))
		draw_line(base + Vector2(-13.0, -159.0), base + Vector2(14.0, -159.0), Color(accent, 0.82), 3.0)
		return
	var skin := Color("#b9a899")
	_draw_ellipse_shape(base + Vector2(0.0, -157.0), Vector2(21.0, 27.0), skin)
	if slot == 0:
		draw_polygon(PackedVector2Array([
			base + Vector2(-22.0, -163.0), base + Vector2(-15.0, -182.0),
			base + Vector2(16.0, -181.0), base + Vector2(23.0, -161.0),
			base + Vector2(7.0, -169.0), base + Vector2(-10.0, -168.0),
		]), PackedColorArray([body.darkened(0.44)]))
	elif slot == 1:
		draw_polygon(PackedVector2Array([
			base + Vector2(-25.0, -163.0), base + Vector2(-9.0, -187.0),
			base + Vector2(21.0, -174.0), base + Vector2(18.0, -156.0),
			base + Vector2(2.0, -169.0),
		]), PackedColorArray([body.darkened(0.5)]))
	else:
		draw_polygon(PackedVector2Array([
			base + Vector2(-22.0, -161.0), base + Vector2(-17.0, -179.0),
			base + Vector2(0.0, -187.0), base + Vector2(20.0, -177.0),
			base + Vector2(23.0, -158.0), base + Vector2(5.0, -168.0),
		]), PackedColorArray([body.darkened(0.46)]))


func _draw_unit_weapon(base: Vector2, _side: String, slot: int, facing: float, accent: Color) -> void:
	var steel := Color("#b7c2ca")
	if slot == 1:
		var front_hand := base + Vector2(facing * 34.0, -66.0)
		var rear_hand := base + Vector2(-facing * 30.0, -72.0)
		draw_line(front_hand, base + Vector2(facing * 76.0, -18.0), steel, 6.0)
		draw_line(rear_hand, base + Vector2(-facing * 65.0, -27.0), steel.darkened(0.16), 5.0)
		draw_line(front_hand + Vector2(-facing * 7.0, 3.0), front_hand + Vector2(facing * 7.0, -7.0), accent.darkened(0.1), 4.0)
		draw_line(rear_hand + Vector2(facing * 6.0, 3.0), rear_hand + Vector2(-facing * 6.0, -6.0), accent.darkened(0.18), 3.0)
	elif slot == 2:
		var hand := base + Vector2(facing * 38.0, -68.0)
		var tip := base + Vector2(facing * 96.0, -10.0)
		draw_line(hand, tip, steel.darkened(0.12), 10.0)
		draw_circle(tip, 9.0, accent.darkened(0.28))
		draw_arc(tip, 13.0, 0.0, TAU, 24, Color(accent, 0.74), 3.0)
	else:
		var hand := base + Vector2(facing * 46.0, -70.0)
		var tip := base + Vector2(facing * 87.0, 3.0)
		draw_line(hand, tip, steel, 13.0)
		draw_line(base + Vector2(facing * 55.0, -47.0), tip, Color(accent, 0.62), 3.0)
		draw_line(hand + Vector2(-facing * 12.0, 5.0), hand + Vector2(facing * 10.0, -8.0), Color("#202a35"), 6.0)


func _draw_emissive_pass(snapshot: Dictionary) -> void:
	var state := snapshot.get("state", {}) as Dictionary
	var positions := snapshot.get("positions", {}) as Dictionary
	var combatants := state.get("combatants", []) as Array
	var playback_seconds := float(snapshot.get("playback_seconds", 0.0))
	for item_value: Variant in combatants:
		if not item_value is Dictionary:
			continue
		var combatant := item_value as Dictionary
		var combatant_id := str(combatant.get("id", ""))
		if positions.has(combatant_id):
			var ground := positions[combatant_id] as Vector2
			draw_set_transform(ground, 0.0, Vector2(UNIT_VISUAL_SCALE, UNIT_VISUAL_SCALE))
			_draw_unit_emissive(Vector2.ZERO, combatant, playback_seconds)
			draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
	if bool(snapshot.get("opening_mode", false)):
		_draw_opening_environment_emissive(snapshot)
	_draw_ambient_particles(snapshot)
	_draw_action_effect(snapshot)


func _draw_opening_environment_emissive(snapshot: Dictionary) -> void:
	var beat := snapshot.get("opening_beat", {}) as Dictionary
	var environment_state := str(beat.get("environmentState", "ordinary"))
	var objective_key := str(beat.get("objectiveKey", ""))
	var playback_seconds := float(snapshot.get("playback_seconds", 0.0))
	var particle_color := Color(0.82, 0.77, 0.46, 0.16)
	if environment_state in ["lockdown", "standing_passage"]:
		particle_color = Color(0.83, 0.31, 0.22, 0.13)
	elif environment_state in ["flyer_wreck", "escape_pod_impact"]:
		particle_color = Color(1.0, 0.43, 0.12, 0.2)
	elif environment_state in ["lake_route", "lake_approach", "lake_departure"]:
		particle_color = Color(0.42, 0.82, 0.84, 0.14)
	elif environment_state == "yacht_safety":
		particle_color = Color(0.35, 0.75, 0.82, 0.12)

	# Deterministic, sparse motion keeps the plate alive without obscuring the lane.
	for particle_index in range(18):
		var phase := float(particle_index) * 1.713
		var drift_speed := 13.0 if environment_state not in ["flyer_wreck", "escape_pod_impact"] else 29.0
		var x := fmod(float((particle_index * 211 + 73) % 1900) + playback_seconds * drift_speed + phase * 9.0, 1920.0)
		var y := 170.0 + float((particle_index * 97) % 650)
		if environment_state in ["flyer_wreck", "escape_pod_impact"]:
			y = fmod(y - playback_seconds * 19.0 + 760.0, 760.0) + 90.0
		else:
			y += sin(playback_seconds * 0.7 + phase) * 13.0
		var radius := 1.5 + float(particle_index % 3) * 0.8
		draw_circle(Vector2(x, y), radius, Color(particle_color, particle_color.a * (0.72 + sin(playback_seconds + phase) * 0.18)))

	if objective_key == "opening.death_order":
		var pulse := 0.18 + sin(playback_seconds * 3.1) * 0.045
		draw_circle(Vector2(960.0, 571.0), 12.0, Color(0.94, 0.24, 0.18, pulse))
		draw_line(Vector2(914.0, 571.0), Vector2(1006.0, 571.0), Color(0.94, 0.24, 0.18, pulse * 0.72), 4.0)
	elif environment_state == "escape_pod_impact":
		for spark_index in range(9):
			var spark_phase := playback_seconds * (1.3 + float(spark_index % 3) * 0.21) + float(spark_index) * 0.84
			var spark_origin := Vector2(1330.0, 690.0)
			var spark_offset := Vector2(cos(spark_phase) * (45.0 + float(spark_index) * 12.0), -absf(sin(spark_phase)) * (36.0 + float(spark_index % 4) * 18.0))
			draw_line(spark_origin + spark_offset, spark_origin + spark_offset + Vector2(-16.0, 24.0), Color(1.0, 0.65, 0.21, 0.42), 3.0)
	elif environment_state in ["lake_route", "lake_approach", "lake_departure"]:
		for glint_index in range(7):
			var glint_x := fmod(float(glint_index) * 284.0 + playback_seconds * 24.0, 1900.0)
			var glint_y := 625.0 + float(glint_index % 4) * 37.0
			draw_line(Vector2(glint_x, glint_y), Vector2(glint_x + 72.0, glint_y - 3.0), Color(0.58, 0.9, 0.88, 0.12), 3.0)
	elif environment_state == "yacht_safety":
		for console_index in range(4):
			var console_x := 630.0 + float(console_index) * 250.0
			draw_line(Vector2(console_x, 714.0), Vector2(console_x + 78.0, 714.0), Color(0.38, 0.88, 0.87, 0.16), 3.0)

	var state := snapshot.get("state", {}) as Dictionary
	if not (state.get("combatants", []) as Array).is_empty():
		return
	var party := snapshot.get("opening_party", []) as Array
	var lead_position := _opening_noncombat_lead_position(snapshot, objective_key)
	for member_index in range(party.size() - 1, -1, -1):
		var member_value: Variant = party[member_index]
		if typeof(member_value) != TYPE_DICTIONARY:
			continue
		var member := member_value as Dictionary
		var ground := lead_position + Vector2(-62.0 * float(member_index), 30.0 * float(member_index))
		var member_accent := Color("#48cfa8") if str(member.get("id", "")) == "hazel" else Color("#65b7ee")
		draw_arc(ground + Vector2(0.0, -46.0), 30.0, PI * 0.62, PI * 1.36, 20, Color(member_accent, 0.18), 3.0)
		_draw_ellipse_shape(ground + Vector2(0.0, 11.0), Vector2(31.0, 7.0), Color(member_accent, 0.075))


func _draw_unit_emissive(position: Vector2, combatant: Dictionary, playback_seconds: float) -> void:
	var side := str(combatant.get("side", "enemy"))
	var slot := int(combatant.get("slot", 0))
	var accent := _bridge_color(str(combatant.get("accentColor", "#63e6ff")), CYAN)
	var alive := bool(combatant.get("alive", true))
	if not alive:
		accent = accent.darkened(0.62)
	var phase := playback_seconds * 1.85 + float(slot) * 0.77 + (0.0 if side == "party" else 0.33)
	var bob := sin(phase) * 2.5 if alive else 0.0
	var breath := sin(phase * 0.72) * 1.8 if alive else 0.0
	var facing := -1.0 if side == "party" else 1.0
	var lean := 7.0 * facing if slot == 1 else 0.0
	var base := position + Vector2(lean, bob + breath)
	draw_circle(base + Vector2(0.0, -88.0), 8.0, accent)
	draw_arc(base + Vector2(0.0, -88.0), 14.0, 0.0, TAU, 28, Color(accent, 0.34), 2.0)
	if slot == 1:
		draw_line(base + Vector2(facing * 34.0, -66.0), base + Vector2(facing * 76.0, -18.0), Color(accent, 0.76), 2.0)
		draw_line(base + Vector2(-facing * 30.0, -72.0), base + Vector2(-facing * 65.0, -27.0), Color(accent, 0.48), 1.5)
	elif slot == 2:
		draw_circle(base + Vector2(facing * 96.0, -10.0), 5.0, Color(accent, 0.84))
	else:
		draw_line(base + Vector2(facing * 55.0, -47.0), base + Vector2(facing * 87.0, 3.0), Color(accent, 0.72), 2.5)
	if bool(combatant.get("hasForceShield", false)):
		for ring in range(3):
			draw_arc(base + Vector2(0.0, -72.0), 74.0 + float(ring) * 7.0, 0.0, TAU, 56, Color(CYAN, 0.28 - float(ring) * 0.06), 4.0)
	if bool(combatant.get("isBoosting", false)):
		draw_arc(base + Vector2(0.0, -68.0), 91.0, 0.0, TAU, 48, Color(GOLD, 0.34), 5.0)


func _draw_ambient_particles(snapshot: Dictionary) -> void:
	var playback_seconds := float(snapshot.get("playback_seconds", 0.0))
	var particles := snapshot.get("ambient_particles", []) as Array
	for particle_value: Variant in particles:
		if not particle_value is Dictionary:
			continue
		var particle := particle_value as Dictionary
		var phase := float(particle.get("phase", 0.0))
		var drift := fmod(playback_seconds * float(particle.get("speed", 0.1)) * 90.0 + phase * 30.0, 900.0)
		var y := fmod(float(particle.get("y", 0.0)) - drift + 900.0, 900.0)
		var alpha := 0.07 + sin(playback_seconds * 1.3 + phase) * 0.025
		draw_circle(Vector2(float(particle.get("x", 0.0)), y), float(particle.get("radius", 1.0)) * 1.7, Color(0.45, 0.84, 0.9, alpha))


func _draw_action_effect(snapshot: Dictionary) -> void:
	var action := snapshot.get("action", {}) as Dictionary
	if action.is_empty():
		return
	var positions := snapshot.get("positions", {}) as Dictionary
	var progress := float(snapshot.get("action_progress", 1.0))
	var elapsed := float(snapshot.get("action_elapsed", 0.0))
	var timing := action.get("timing", {}) as Dictionary
	var duration := float(timing.get("durationSeconds", 0.3))
	var contact_value: Variant = timing.get("visualContactSeconds")
	var contact := float(contact_value) if contact_value != null else duration
	var beam_value: Variant = timing.get("beamStartSeconds")
	var beam_start := float(beam_value) if beam_value != null else 0.0
	var effect_active := elapsed <= duration
	if not effect_active:
		return
	var actor_id := str(action.get("actorId", ""))
	var target_id := str(action.get("targetId", ""))
	if not positions.has(actor_id):
		return
	var actor := (positions[actor_id] as Vector2) + Vector2(0.0, -82.0)
	var target := (positions[target_id] as Vector2) + Vector2(0.0, -82.0) if positions.has(target_id) else actor
	var action_type := str(action.get("type", ""))
	var category := str(action.get("abilityCategory", ""))
	var alpha := 1.0 - progress

	if action_type == "disruptor":
		if elapsed < beam_start:
			var charge_progress := elapsed / maxf(beam_start, 0.001)
			for ring in range(3):
				draw_arc(actor, 18.0 + float(ring) * 13.0 + charge_progress * 14.0, 0.0, TAU, 40, Color(GREEN, 0.42 - float(ring) * 0.08), 4.0)
		elif elapsed < contact:
			var beam_progress := (elapsed - beam_start) / maxf(contact - beam_start, 0.001)
			var beam_end := actor.lerp(target, clampf(beam_progress, 0.0, 1.0))
			draw_line(actor, beam_end, Color(0.18, 0.78, 0.5, 0.34), 22.0)
			draw_line(actor, beam_end, Color(0.5, 1.0, 0.72, 0.94), 8.0)
			draw_line(actor, beam_end, Color.WHITE, 2.0)
		else:
			var impact_progress := (elapsed - contact) / maxf(duration - contact, 0.001)
			for ring in range(3):
				draw_arc(target, 22.0 + impact_progress * (52.0 + float(ring) * 14.0), 0.0, TAU, 40, Color(GREEN, (1.0 - impact_progress) * 0.62), 6.0)
	elif action_type == "attack" and category == "melee" and elapsed >= contact:
		var contact_progress := (elapsed - contact) / maxf(duration - contact, 0.001)
		draw_line(target + Vector2(-54.0, -66.0), target + Vector2(48.0, 58.0), Color(GOLD, 1.0 - contact_progress), 9.0)
		draw_line(target + Vector2(-35.0, -70.0), target + Vector2(64.0, 40.0), Color(Color.WHITE, 1.0 - contact_progress), 3.0)
	elif action_type == "attack":
		var travel_progress := clampf(elapsed / maxf(contact, 0.001), 0.0, 1.0)
		var projectile := actor.lerp(target, travel_progress)
		draw_line(actor, projectile, Color(CYAN, 0.42), 10.0)
		draw_circle(projectile, 11.0, Color(CYAN, 0.92))
	elif action_type == "esper_ability":
		var wave_progress := clampf(elapsed / maxf(contact, 0.001), 0.0, 1.0)
		for ring in range(4):
			draw_arc(target, 18.0 + wave_progress * (55.0 + float(ring) * 18.0), 0.0, TAU, 48, Color(0.74, 0.42, 1.0, (1.0 - wave_progress) * 0.62), 5.0)
	elif action_type == "raise_shield":
		for ring in range(4):
			draw_arc(actor, 34.0 + progress * (42.0 + float(ring) * 8.0), 0.0, TAU, 56, Color(CYAN, alpha * 0.58), 5.0)
	elif action_type == "toggle_boost":
		for ray in range(10):
			var angle := float(ray) / 10.0 * TAU
			draw_line(actor + Vector2(cos(angle), sin(angle)) * 28.0, actor + Vector2(cos(angle), sin(angle)) * (46.0 + progress * 44.0), Color(GOLD, alpha * 0.64), 4.0)
	elif action_type in ["use_medkit", "use_revive"]:
		draw_arc(target, 20.0 + progress * 62.0, 0.0, TAU, 48, Color(GREEN, alpha * 0.7), 7.0)


func _draw_foreground_occluders(snapshot: Dictionary) -> void:
	if bool(snapshot.get("opening_mode", false)):
		_draw_virimonde_foreground(snapshot)
		return
	var authored_texture := _environment_texture(snapshot, "foreground_occluder")
	if authored_texture != null:
		draw_texture_rect(authored_texture, Rect2(Vector2.ZERO, DESIGN_SIZE), false, Color(0.84, 0.87, 0.94, 0.88))
		return
	for softness_index in range(7, -1, -1):
		var spread := float(softness_index) * 17.0
		var alpha := 0.025 + float(7 - softness_index) * 0.026
		draw_colored_polygon(PackedVector2Array([
			Vector2(-55.0 - spread, 810.0 - spread),
			Vector2(135.0 + spread, 885.0 - spread * 0.25),
			Vector2(240.0 + spread, 1080.0),
			Vector2(-55.0 - spread, 1080.0),
		]), Color(0.005, 0.008, 0.015, alpha))
		draw_colored_polygon(PackedVector2Array([
			Vector2(1975.0 + spread, 810.0 - spread),
			Vector2(1785.0 - spread, 885.0 - spread * 0.25),
			Vector2(1680.0 - spread, 1080.0),
			Vector2(1975.0 + spread, 1080.0),
		]), Color(0.005, 0.008, 0.015, alpha))
	# Soft machinery silhouettes frame the combat lane without covering units or UI.
	draw_rect(Rect2(-18.0, 746.0, 86.0, 334.0), Color(0.008, 0.012, 0.02, 0.34))
	draw_circle(Vector2(52.0, 782.0), 62.0, Color(0.008, 0.012, 0.02, 0.3))
	draw_rect(Rect2(1852.0, 735.0, 86.0, 345.0), Color(0.008, 0.012, 0.02, 0.34))
	draw_circle(Vector2(1870.0, 777.0), 68.0, Color(0.008, 0.012, 0.02, 0.3))


func _draw_half_resolution_post(snapshot: Dictionary) -> void:
	draw_rect(Rect2(Vector2.ZERO, HALF_SIZE), Color(0.015, 0.035, 0.080, 0.11))
	var environment := _environment(snapshot)
	var light := _bridge_color(str(environment.get("lightColor", "#ffe080")), Color("#ffe080"))
	var source_x := float(environment.get("lightSourceX", 0.5)) * HALF_SIZE.x
	var shaft := PackedVector2Array([
		Vector2(source_x - 58.0, 0.0),
		Vector2(source_x + 58.0, 0.0),
		Vector2(source_x + 140.0, 418.0),
		Vector2(source_x - 215.0, 418.0),
	])
	draw_colored_polygon(shaft, Color(light, 0.035))
	if bool(snapshot.get("opening_mode", false)):
		_draw_opening_half_resolution_grade(snapshot)
	_draw_half_resolution_bloom(snapshot)
	for edge_index in range(9):
		var alpha := 0.018 + float(edge_index) * 0.008
		var inset := float(edge_index) * 8.0
		draw_rect(Rect2(inset, inset, HALF_SIZE.x - inset * 2.0, HALF_SIZE.y - inset * 2.0), Color(0.0, 0.0, 0.03, alpha), false, 11.0)


func _draw_opening_half_resolution_grade(snapshot: Dictionary) -> void:
	var beat := snapshot.get("opening_beat", {}) as Dictionary
	var environment_state := str(beat.get("environmentState", "ordinary"))
	var grade := Color(0.16, 0.23, 0.16, 0.025)
	if environment_state in ["lockdown", "standing_passage"]:
		grade = Color(0.08, 0.12, 0.18, 0.052)
	elif environment_state == "flyer_wreck":
		grade = Color(0.17, 0.12, 0.09, 0.046)
	elif environment_state == "escape_pod_impact":
		grade = Color(0.28, 0.11, 0.045, 0.05)
	elif environment_state in ["lake_route", "lake_approach", "lake_departure"]:
		grade = Color(0.06, 0.17, 0.2, 0.045)
	elif environment_state == "yacht_safety":
		grade = Color(0.025, 0.075, 0.14, 0.07)
	draw_rect(Rect2(Vector2.ZERO, HALF_SIZE), grade)
	if environment_state != "yacht_safety":
		draw_colored_polygon(PackedVector2Array([
			Vector2(660.0, 0.0), Vector2(835.0, 0.0), Vector2(920.0, 385.0), Vector2(585.0, 385.0),
		]), Color(0.95, 0.68, 0.32, 0.018))
	if environment_state == "escape_pod_impact":
		draw_circle(Vector2(665.0, 335.0), 72.0, Color(1.0, 0.28, 0.05, 0.035))


func _draw_half_resolution_bloom(snapshot: Dictionary) -> void:
	var state := snapshot.get("state", {}) as Dictionary
	var positions := snapshot.get("positions", {}) as Dictionary
	var combatants := state.get("combatants", []) as Array
	for item_value: Variant in combatants:
		if not item_value is Dictionary:
			continue
		var combatant := item_value as Dictionary
		var combatant_id := str(combatant.get("id", ""))
		if not positions.has(combatant_id):
			continue
		var accent := _bridge_color(str(combatant.get("accentColor", "#63e6ff")), CYAN)
		var center := ((positions[combatant_id] as Vector2) + Vector2(0.0, -80.0)) * 0.5
		for glow_index in range(4, 0, -1):
			var radius := 5.0 + float(glow_index) * 5.0
			var alpha := 0.010 + float(5 - glow_index) * 0.009
			draw_circle(center, radius, Color(accent, alpha))
	var action := snapshot.get("action", {}) as Dictionary
	var elapsed := float(snapshot.get("action_elapsed", 0.0))
	var timing := action.get("timing", {}) as Dictionary
	var duration := float(timing.get("durationSeconds", 0.0))
	if action.is_empty() or elapsed > duration:
		return
	var target_id := str(action.get("targetId", ""))
	if not positions.has(target_id):
		return
	var target := ((positions[target_id] as Vector2) + Vector2(0.0, -82.0)) * 0.5
	var contact_value: Variant = timing.get("visualContactSeconds")
	if contact_value == null:
		return
	var contact := float(contact_value)
	var bloom_progress := clampf((elapsed - contact) / maxf(0.001, duration - contact), 0.0, 1.0)
	if elapsed >= contact:
		draw_circle(target, 22.0 + bloom_progress * 32.0, Color(GOLD, (1.0 - bloom_progress) * 0.12))


func _combatant_by_id(state: Dictionary, combatant_id: String) -> Dictionary:
	var combatants := state.get("combatants", []) as Array
	for combatant_value: Variant in combatants:
		if not combatant_value is Dictionary:
			continue
		var combatant := combatant_value as Dictionary
		if str(combatant.get("id", "")) == combatant_id:
			return combatant
	return {}


func _draw_queue_token(center: Vector2, combatant: Dictionary, active: bool) -> void:
	var accent := _bridge_color(str(combatant.get("accentColor", "#63e6ff")), CYAN)
	var side := str(combatant.get("side", "enemy"))
	var slot := int(combatant.get("slot", 0))
	var outer_radius := 21.0 if active else 18.0
	var outer_color := GOLD if active else Color(accent, 0.74)
	var outer := PackedVector2Array([
		center + Vector2(0.0, -outer_radius), center + Vector2(outer_radius, 0.0),
		center + Vector2(0.0, outer_radius), center + Vector2(-outer_radius, 0.0),
	])
	draw_colored_polygon(outer, Color(0.018, 0.032, 0.052, 0.96))
	for edge in range(4):
		draw_line(outer[edge], outer[(edge + 1) % 4], outer_color, 2.0 if active else 1.5)
	var side_offset := -1.0 if side == "enemy" else 1.0
	draw_polygon(PackedVector2Array([
		center + Vector2(side_offset * 14.0, 8.0),
		center + Vector2(side_offset * 14.0, 15.0),
		center + Vector2(side_offset * 6.0, 15.0),
	]), PackedColorArray([Color(accent, 0.86)]))
	if slot == 0:
		draw_polygon(PackedVector2Array([
			center + Vector2(-8.0, -7.0), center + Vector2(8.0, -7.0),
			center + Vector2(11.0, 7.0), center + Vector2(-11.0, 7.0),
		]), PackedColorArray([Color(accent, 0.76)]))
		draw_line(center + Vector2(4.0, -10.0), center + Vector2(-5.0, 11.0), Color.WHITE, 2.0)
	elif slot == 1:
		draw_line(center + Vector2(-9.0, -9.0), center + Vector2(8.0, 10.0), Color(accent, 0.94), 3.0)
		draw_line(center + Vector2(9.0, -9.0), center + Vector2(-8.0, 10.0), Color.WHITE, 2.0)
	else:
		draw_arc(center, 8.0, 0.0, TAU, 20, Color(accent, 0.9), 3.0)
		draw_line(center + Vector2(-11.0, 0.0), center + Vector2(11.0, 0.0), Color.WHITE, 2.0)


func _draw_interface(snapshot: Dictionary) -> void:
	var state := snapshot.get("state", {}) as Dictionary
	var frame := snapshot.get("frame", {}) as Dictionary
	var action := snapshot.get("action", {}) as Dictionary
	var positions := snapshot.get("positions", {}) as Dictionary
	var frame_index := int(snapshot.get("frame_index", 0))
	var playback_seconds := float(snapshot.get("playback_seconds", 0.0))
	var duration_seconds := maxf(0.001, float(snapshot.get("duration_seconds", 1.0)))
	var bridge := snapshot.get("bridge", {}) as Dictionary
	var live_mode := bool(snapshot.get("live_mode", false))
	var font := ThemeDB.fallback_font
	draw_rect(Rect2(0.0, 0.0, 1920.0, 64.0), Color(0.005, 0.009, 0.02, 0.58 if live_mode else 0.86))
	if not live_mode:
		draw_string(font, Vector2(34.0, 39.0), "GODOT PRESENTATION CLIENT", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 22, CYAN)
		draw_string(font, Vector2(330.0, 38.0), "TYPESCRIPT CORE AUTHORITY  •  BRIDGE V%d  •  FULL-SCENE 960x540 POST" % int(bridge.get("schemaVersion", 0)), HORIZONTAL_ALIGNMENT_LEFT, -1.0, 18, Color(0.7, 0.77, 0.83, 1.0))
	var top_right := (
		"SEQ %d  •  %.3f ms" % [int(snapshot.get("live_sequence", 0)), float(snapshot.get("live_request_ms", 0.0))]
		if live_mode
		else "%05.2f / %05.2f" % [playback_seconds, duration_seconds]
	)
	if live_mode:
		draw_string(font, Vector2(1518.0, 38.0), "R  RESTART   •   TAB  DEBUG", HORIZONTAL_ALIGNMENT_RIGHT, 368.0, 15, Color(MUTED, 0.72))
	else:
		draw_string(font, Vector2(1540.0, 38.0), top_right, HORIZONTAL_ALIGNMENT_RIGHT, 346.0, 18, Color.WHITE)

	var queue := state.get("turnQueue", []) as Array
	for index in range(mini(10, queue.size())):
		var entry := queue[index] as Dictionary
		var x := 34.0 + float(index) * 52.0
		var actor_id := str(entry.get("actorId", ""))
		var active := actor_id == str(state.get("activeActorId", ""))
		var queue_y := 32.0 if live_mode else 98.0
		var queue_combatant := _combatant_by_id(state, actor_id)
		if queue_combatant.is_empty():
			draw_circle(Vector2(x + 18.0, queue_y), 16.0, GOLD if active else Color(0.18, 0.24, 0.32, 0.92))
			draw_string(font, Vector2(x + 5.0, queue_y + 6.0), str(index + 1), HORIZONTAL_ALIGNMENT_CENTER, 26.0, 13, Color("#07101d") if active else Color.WHITE)
		else:
			_draw_queue_token(Vector2(x + 18.0, queue_y), queue_combatant, active)

	var opening_mode := bool(snapshot.get("opening_mode", false))
	var live_awaiting := str(snapshot.get("live_awaiting", ""))
	var action_label := "CHOOSE AN ACTION" if live_mode and live_awaiting == "player" else "INITIAL SNAPSHOT"
	if not action.is_empty():
		var ability_value: Variant = action.get("abilityName")
		action_label = str(ability_value) if ability_value != null else str(action.get("type", "")).replace("_", " ").to_upper()
	var audio_value: Variant = action.get("audioCue")
	if audio_value != null and not live_mode:
		action_label += "  •  AUDIO %s" % str(audio_value).to_upper()
	var show_action_header := not (opening_mode and action.is_empty() and live_awaiting != "player")
	if show_action_header:
		var action_rect := Rect2(650.0, 78.0, 620.0, 42.0) if live_mode else Rect2(560.0, 82.0, 800.0, 50.0)
		draw_rect(action_rect, Color(0.003, 0.008, 0.018, 0.5 if live_mode else 0.74))
		draw_line(action_rect.position, action_rect.position + Vector2(action_rect.size.x, 0.0), Color(CYAN, 0.42), 1.0)
		if not live_mode:
			draw_rect(Rect2(560.0, 130.0, 800.0 * playback_seconds / duration_seconds, 3.0), CYAN)
		draw_string(font, action_rect.position + Vector2(20.0, 28.0), action_label, HORIZONTAL_ALIGNMENT_CENTER, action_rect.size.x - 40.0, 18, GOLD)
	_draw_combatant_labels(state, positions, playback_seconds)
	_draw_damage_popups(snapshot, state, positions)
	if live_mode:
		_draw_live_command_menu(snapshot)
	if bool(snapshot.get("world_loop_mode", false)):
		_draw_world_loop_interface(snapshot)
	elif opening_mode:
		_draw_opening_interface(snapshot)

	if not bool(snapshot.get("show_overlay", true)):
		return
	var source := bridge.get("source", {}) as Dictionary
	var encounter := bridge.get("encounter", {}) as Dictionary
	var layer_visibility := snapshot.get("layer_visibility", []) as Array
	draw_rect(Rect2(30.0, 860.0, 760.0, 188.0), Color(0.004, 0.009, 0.02, 0.88))
	draw_rect(Rect2(30.0, 860.0, 5.0, 188.0), CYAN)
	draw_string(font, Vector2(54.0, 893.0), str(encounter.get("name", "")), HORIZONTAL_ALIGNMENT_LEFT, -1.0, 19, CYAN)
	draw_string(font, Vector2(54.0, 923.0), "Snapshot %d / %d  •  Core turn %d  •  %s" % [frame_index + 1, int(snapshot.get("frame_count", 0)), int(state.get("turnNumber", 0)), str(state.get("status", ""))], HORIZONTAL_ALIGNMENT_LEFT, -1.0, 17, Color.WHITE)
	draw_string(font, Vector2(54.0, 952.0), "%s %s  •  seed %d  •  frame %.2f ms" % ["Session" if live_mode else "Fixture", str(source.get("fixtureId", "")), int(source.get("seed", 0)), _average_frame_ms(snapshot)], HORIZONTAL_ALIGNMENT_LEFT, -1.0, 17, Color(0.78, 0.84, 0.89, 1.0))
	draw_string(font, Vector2(54.0, 981.0), "Layers %s  •  F1-F9 toggle  •  F10 restore  •  F12 diagnose" % _layer_mask(layer_visibility), HORIZONTAL_ALIGNMENT_LEFT, -1.0, 15, GOLD)
	var controls := "1-9 / CLICK act  •  ↑↓ select  •  ENTER confirm  •  R restart" if live_mode else "SPACE pause  •  R restart  •  TAB overlay  •  ESC quit"
	draw_string(font, Vector2(54.0, 1010.0), controls, HORIZONTAL_ALIGNMENT_LEFT, -1.0, 15, MUTED)
	draw_string(font, Vector2(54.0, 1038.0), "Resolved TypeScript transitions and semantic cues only; no GDScript combat resolution.", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 15, Color(0.72, 0.8, 0.86, 1.0))


func _draw_live_command_menu(snapshot: Dictionary) -> void:
	var font := ThemeDB.fallback_font
	var items := snapshot.get("live_action_menu", []) as Array
	var awaiting := str(snapshot.get("live_awaiting", ""))
	var error := str(snapshot.get("live_error", ""))
	var transition_playing := bool(snapshot.get("live_transition_playing", false))
	if error.is_empty() and (awaiting != "player" or transition_playing):
		return
	var first_rect := Rect2(1040.0, 210.0, 400.0, 46.0)
	if not items.is_empty() and typeof(items[0]) == TYPE_DICTIONARY:
		first_rect = (items[0] as Dictionary).get("rect", first_rect)
	var header_rect := Rect2(first_rect.position + Vector2(-2.0, -34.0), Vector2(first_rect.size.x + 4.0, 30.0))
	draw_rect(header_rect, Color(0.004, 0.009, 0.02, 0.36))
	draw_line(header_rect.position, header_rect.position + Vector2(header_rect.size.x, 0.0), Color("#63e6ff"), 2.0)
	draw_string(font, header_rect.position + Vector2(10.0, 22.0), "COMMAND", HORIZONTAL_ALIGNMENT_LEFT, header_rect.size.x - 20.0, 15, GOLD)
	if not error.is_empty():
		var error_rect := Rect2(first_rect.position, Vector2(first_rect.size.x, 62.0))
		draw_rect(error_rect, Color(0.18, 0.018, 0.028, 0.62))
		draw_string(font, error_rect.position + Vector2(10.0, 36.0), error, HORIZONTAL_ALIGNMENT_LEFT, error_rect.size.x - 20.0, 15, Color("#ffb0b0"))
		return
	for item_value: Variant in items:
		if typeof(item_value) != TYPE_DICTIONARY:
			continue
		var item := item_value as Dictionary
		var rect: Rect2 = item.get("rect", Rect2())
		var selected := bool(item.get("selected", false))
		var index := int(item.get("index", 0))
		draw_rect(rect, Color(0.06, 0.15, 0.22, 0.58) if selected else Color(0.006, 0.014, 0.026, 0.32))
		draw_rect(rect, Color(GOLD, 0.96) if selected else Color(0.39, 0.72, 0.82, 0.56), false, 1.5)
		draw_string(font, rect.position + Vector2(12.0, 30.0), "%d" % (index + 1), HORIZONTAL_ALIGNMENT_CENTER, 24.0, 15, GOLD)
		var label_position := rect.position + Vector2(49.0, 30.0)
		var label := str(item.get("label", "Action"))
		draw_string(font, label_position + Vector2(1.0, 1.0), label, HORIZONTAL_ALIGNMENT_LEFT, rect.size.x - 62.0, 17, Color(0.0, 0.0, 0.0, 0.86))
		draw_string(font, label_position, label, HORIZONTAL_ALIGNMENT_LEFT, rect.size.x - 62.0, 17, Color.WHITE)


func _draw_world_loop_interface(snapshot: Dictionary) -> void:
	var font := ThemeDB.fallback_font
	var location := snapshot.get("world_loop_location", {}) as Dictionary
	var campaign := snapshot.get("world_loop_campaign", {}) as Dictionary
	var party := snapshot.get("world_loop_party", []) as Array
	var inventory := campaign.get("inventory", {}) as Dictionary
	var location_id := str(location.get("id", ""))
	var location_title := location_id.replace("_", " ").capitalize()
	match location_id:
		"safe_hub": location_title = "Proving Hub"
		"field_route": location_title = "Field Route"
		"boss_approach": location_title = "Boss Approach"
	var has_combatants := not ((snapshot.get("state", {}) as Dictionary).get("combatants", []) as Array).is_empty()

	var location_card := Rect2(34.0, 78.0, 490.0, 92.0)
	draw_rect(location_card, Color(0.002, 0.009, 0.016, 0.38))
	draw_rect(location_card, Color(0.38, 0.83, 0.84, 0.45), false, 1.5)
	draw_rect(Rect2(location_card.position, Vector2(5.0, location_card.size.y)), GOLD)
	draw_string(font, location_card.position + Vector2(24.0, 35.0), location_title, HORIZONTAL_ALIGNMENT_LEFT, 440.0, 24, Color.WHITE)
	draw_string(font, location_card.position + Vector2(24.0, 66.0), "NONCANONICAL SYSTEMS FIXTURE", HORIZONTAL_ALIGNMENT_LEFT, 440.0, 13, Color(GOLD, 0.86))

	var campaign_card := Rect2(1470.0, 70.0, 416.0, 236.0)
	draw_rect(campaign_card, Color(0.002, 0.009, 0.016, 0.34))
	draw_rect(campaign_card, Color(0.42, 0.75, 0.82, 0.38), false, 1.0)
	draw_string(
		font,
		campaign_card.position + Vector2(20.0, 30.0),
		"LEVEL %d   •   XP %d / %s" % [
			int(campaign.get("partyLevel", 1)),
			int(campaign.get("xp", 0)),
			"MAX" if campaign.get("nextLevelXp") == null else str(int(campaign.get("nextLevelXp", 0))),
		],
		HORIZONTAL_ALIGNMENT_LEFT,
		campaign_card.size.x - 40.0,
		15,
		Color(GOLD, 0.94)
	)
	draw_string(
		font,
		campaign_card.position + Vector2(20.0, 58.0),
		"GOLD %d   •   MEDKITS %d   •   REVIVES %d" % [
			int(campaign.get("gold", 0)),
			int(inventory.get("medkits", 0)),
			int(inventory.get("revives", 0)),
		],
		HORIZONTAL_ALIGNMENT_LEFT,
		campaign_card.size.x - 40.0,
		14,
		Color(0.78, 0.86, 0.89, 0.9)
	)
	for member_index in mini(3, party.size()):
		var member_value: Variant = party[member_index]
		if typeof(member_value) != TYPE_DICTIONARY:
			continue
		var member := member_value as Dictionary
		var row_y := campaign_card.position.y + 92.0 + float(member_index) * 43.0
		var hp := float(member.get("hp", 0.0))
		var max_hp := maxf(1.0, float(member.get("maxHp", 1.0)))
		draw_string(font, Vector2(campaign_card.position.x + 20.0, row_y + 17.0), str(member.get("name", "")), HORIZONTAL_ALIGNMENT_LEFT, 155.0, 14, Color.WHITE)
		draw_rect(Rect2(campaign_card.position.x + 176.0, row_y + 4.0, 150.0, 10.0), Color(0.01, 0.018, 0.024, 0.7))
		draw_rect(Rect2(campaign_card.position.x + 176.0, row_y + 4.0, 150.0 * clampf(hp / max_hp, 0.0, 1.0), 10.0), Color("#78d7a0"))
		draw_string(font, Vector2(campaign_card.position.x + 336.0, row_y + 17.0), "%d/%d" % [int(hp), int(max_hp)], HORIZONTAL_ALIGNMENT_RIGHT, 60.0, 12, Color(0.82, 0.88, 0.9, 0.9))

	if has_combatants:
		return
	var nearby := snapshot.get("world_loop_nearby_interactable", {}) as Dictionary
	var prompt := Rect2(560.0, 956.0, 800.0, 76.0)
	draw_rect(prompt, Color(0.002, 0.009, 0.016, 0.36))
	draw_rect(prompt, Color(GOLD, 0.48), false, 1.5)
	var prompt_title := "EXPLORE WITH A/D OR LEFT/RIGHT   •   CLICK TO MOVE"
	var prompt_detail := str(snapshot.get("world_loop_last_event", ""))
	if not nearby.is_empty():
		prompt_title = "ENTER / E   %s" % str(nearby.get("label", "Interact")).to_upper()
		prompt_detail = str(nearby.get("detail", ""))
	draw_string(font, prompt.position + Vector2(24.0, 30.0), prompt_title, HORIZONTAL_ALIGNMENT_CENTER, prompt.size.x - 48.0, 16, Color.WHITE)
	draw_string(font, prompt.position + Vector2(24.0, 57.0), prompt_detail, HORIZONTAL_ALIGNMENT_CENTER, prompt.size.x - 48.0, 13, Color(0.74, 0.82, 0.84, 0.92))


func _draw_opening_interface(snapshot: Dictionary) -> void:
	var beat := snapshot.get("opening_beat", {}) as Dictionary
	if beat.is_empty():
		return
	var font := ThemeDB.fallback_font
	var objective_key := str(beat.get("objectiveKey", ""))
	var title := _opening_title(objective_key)
	var objective := _opening_objective(objective_key)
	var beat_index := int(snapshot.get("opening_beat_index", 0))
	var beat_count := maxi(1, int(snapshot.get("opening_beat_count", 10)))
	var waiting := str(snapshot.get("live_awaiting", ""))
	var state := snapshot.get("state", {}) as Dictionary
	var has_combatants := not (state.get("combatants", []) as Array).is_empty()

	draw_rect(Rect2(34.0, 82.0, 430.0, 54.0), Color(0.004, 0.01, 0.018, 0.52))
	draw_rect(Rect2(34.0, 82.0, 430.0 * float(beat_index + 1) / float(beat_count), 3.0), GOLD)
	draw_string(font, Vector2(52.0, 116.0), "SEPARATION  %02d / %02d" % [beat_index + 1, beat_count], HORIZONTAL_ALIGNMENT_LEFT, 390.0, 16, Color(MUTED, 0.9))

	if not has_combatants:
		var card := Rect2(1110.0, 150.0, 670.0, 176.0)
		draw_rect(card, Color(0.004, 0.012, 0.02, 0.46))
		draw_rect(Rect2(card.position + Vector2(0.0, 82.0), Vector2(card.size.x, card.size.y - 82.0)), Color(0.018, 0.045, 0.048, 0.18))
		draw_rect(card, Color(0.54, 0.77, 0.69, 0.55), false, 1.5)
		draw_rect(Rect2(card.position, Vector2(5.0, card.size.y)), GOLD)
		draw_line(card.position + Vector2(24.0, 72.0), card.position + Vector2(card.size.x - 24.0, 72.0), Color(0.54, 0.77, 0.69, 0.18), 1.0)
		draw_string(font, card.position + Vector2(30.0, 47.0), title, HORIZONTAL_ALIGNMENT_LEFT, card.size.x - 60.0, 28, Color.WHITE)
		draw_string(font, card.position + Vector2(30.0, 87.0), objective, HORIZONTAL_ALIGNMENT_LEFT, card.size.x - 60.0, 17, Color(0.82, 0.88, 0.85, 0.96))
		var party := snapshot.get("opening_party", []) as Array
		var inventory := snapshot.get("opening_inventory", {}) as Dictionary
		var condition := ""
		for member_value: Variant in party:
			if typeof(member_value) != TYPE_DICTIONARY:
				continue
			var member := member_value as Dictionary
			if not condition.is_empty():
				condition += "   •   "
			condition += "%s  %d/%d" % [
				str(member.get("name", "")),
				int(member.get("hp", 0)),
				int(member.get("maxHp", 0)),
			]
		draw_string(font, card.position + Vector2(30.0, 123.0), condition, HORIZONTAL_ALIGNMENT_LEFT, card.size.x - 60.0, 15, Color(GOLD, 0.9))
		var persistence_label := "AUTOSAVE UNAVAILABLE"
		if bool(snapshot.get("opening_persistence_available", false)):
			var checkpoint_sequence := int(snapshot.get("opening_checkpoint_sequence", -1))
			persistence_label = "AUTOSAVED %02d" % checkpoint_sequence if checkpoint_sequence >= 0 else "AUTOSAVE READY"
		draw_string(
			font,
			card.position + Vector2(30.0, 153.0),
			"MEDKITS %d   •   REVIVES %d   •   %s" % [
				int(inventory.get("medkits", 0)),
				int(inventory.get("revives", 0)),
				persistence_label,
			],
			HORIZONTAL_ALIGNMENT_LEFT,
			card.size.x - 60.0,
			14,
			Color(MUTED, 0.9)
		)
	else:
		draw_rect(Rect2(650.0, 126.0, 620.0, 34.0), Color(0.004, 0.01, 0.018, 0.42))
		draw_string(font, Vector2(670.0, 149.0), title, HORIZONTAL_ALIGNMENT_CENTER, 580.0, 15, Color(GOLD, 0.94))

	if (
		bool(snapshot.get("opening_traversal_active", false))
		and not bool(snapshot.get("opening_traversal_complete", false))
	):
		var prompt_beat := snapshot.get("opening_beat", {}) as Dictionary
		var is_betrayal_route := str(prompt_beat.get("objectiveKey", "")) == "opening.death_order"
		var movement_prompt := Rect2(1110.0, 342.0, 670.0, 50.0)
		draw_rect(movement_prompt, Color(0.004, 0.012, 0.02, 0.38))
		draw_rect(movement_prompt, Color(GOLD, 0.68), false, 1.5)
		draw_string(
			font,
			movement_prompt.position + Vector2(20.0, 32.0),
			(
				"MOVE LEFT / A   •   CLICK THE ROUTE   •   BREAK FROM THE STANDING PERSONNEL"
				if is_betrayal_route
				else "MOVE  A/D OR LEFT/RIGHT   •   CLICK THE ROUTE   •   REACH OWEN'S SUPPLIES"
			),
			HORIZONTAL_ALIGNMENT_CENTER,
			movement_prompt.size.x - 40.0,
			15,
			Color.WHITE
		)
	elif (
		bool(snapshot.get("opening_traversal_active", false))
		and bool(snapshot.get("opening_supplies_inspected", false))
	):
		var inspection_panel := Rect2(1110.0, 342.0, 670.0, 50.0)
		draw_rect(inspection_panel, Color(0.006, 0.045, 0.038, 0.54))
		draw_rect(inspection_panel, Color(GREEN, 0.78), false, 1.5)
		draw_string(
			font,
			inspection_panel.position + Vector2(20.0, 32.0),
			"SUPPLIES CONFIRMED   •   NO RESOURCES SPENT",
			HORIZONTAL_ALIGNMENT_CENTER,
			inspection_panel.size.x - 40.0,
			15,
			Color.WHITE
		)

	for button_value: Variant in snapshot.get("opening_prompt_buttons", []) as Array:
		if typeof(button_value) != TYPE_DICTIONARY:
			continue
		var button := button_value as Dictionary
		var rect: Rect2 = button.get("rect", Rect2())
		var selected := bool(button.get("selected", false))
		draw_rect(rect, Color(0.04, 0.12, 0.15, 0.68) if selected else Color(0.004, 0.012, 0.02, 0.48))
		draw_rect(rect, Color(GOLD, 0.94) if selected else Color(0.47, 0.7, 0.65, 0.62), false, 1.5)
		draw_string(font, rect.position + Vector2(20.0, 36.0), str(button.get("label", "Continue")), HORIZONTAL_ALIGNMENT_CENTER, rect.size.x - 40.0, 18, Color.WHITE)

	if waiting == "complete":
		draw_string(font, Vector2(1220.0, 840.0), "OPENING EXPEDITION COMPLETE", HORIZONTAL_ALIGNMENT_CENTER, 540.0, 18, GOLD)


func _draw_combatant_labels(state: Dictionary, positions: Dictionary, playback_seconds: float) -> void:
	var font := ThemeDB.fallback_font
	var combatants := state.get("combatants", []) as Array
	for item_value: Variant in combatants:
		if not item_value is Dictionary:
			continue
		var combatant := item_value as Dictionary
		var combatant_id := str(combatant.get("id", ""))
		if not positions.has(combatant_id):
			continue
		var position := positions[combatant_id] as Vector2
		var alive := bool(combatant.get("alive", true))
		var bob := sin(playback_seconds * 1.85 + position.x * 0.009) * 2.5 if alive else 0.0
		var base := position + Vector2(0.0, bob)
		var accent := _bridge_color(str(combatant.get("accentColor", "#63e6ff")), CYAN)
		if not alive:
			accent = accent.darkened(0.62)
		var hp := float(combatant.get("hp", 0.0))
		var max_hp := maxf(1.0, float(combatant.get("maxHp", 1.0)))
		var is_party := str(combatant.get("side", "enemy")) == "party"
		var bar_width := 92.0 if is_party else 70.0
		draw_rect(Rect2(base.x - bar_width * 0.5, base.y + 27.0, bar_width, 6.0), Color(0.0, 0.0, 0.0, 0.72))
		draw_rect(Rect2(base.x - bar_width * 0.5, base.y + 27.0, bar_width * hp / max_hp, 6.0), accent)
		var name_color := Color.WHITE if is_party else Color(0.86, 0.84, 0.88, 0.9)
		var name_width := 152.0 if is_party else 104.0
		draw_string(font, base + Vector2(-name_width * 0.5, -164.0), str(combatant.get("displayName", combatant_id)), HORIZONTAL_ALIGNMENT_CENTER, name_width, 14 if is_party else 12, name_color)
		if is_party:
			draw_string(font, base + Vector2(-110.0, -146.0), str(combatant.get("role", "")), HORIZONTAL_ALIGNMENT_CENTER, 220.0, 11, Color(accent, 0.86))
		var band_value: Variant = (combatant.get("range", {}) as Dictionary).get("band")
		if band_value != null:
			var band_width := 104.0 if is_party else 72.0
			draw_string(font, base + Vector2(-band_width * 0.5, 51.0), str(band_value).to_upper(), HORIZONTAL_ALIGNMENT_CENTER, band_width, 12 if is_party else 10, Color(accent, 0.82 if is_party else 0.62))


func _draw_damage_popups(snapshot: Dictionary, state: Dictionary, positions: Dictionary) -> void:
	var action := snapshot.get("action", {}) as Dictionary
	if action.is_empty():
		return
	var timing := action.get("timing", {}) as Dictionary
	var contact_value: Variant = timing.get("visualContactSeconds")
	if contact_value == null:
		return
	var elapsed := float(snapshot.get("action_elapsed", 0.0))
	var contact := float(contact_value)
	if elapsed < contact or elapsed > contact + 0.3:
		return
	var popup_progress := (elapsed - contact) / 0.3
	var events := state.get("events", []) as Array
	for item_value: Variant in events:
		if not item_value is Dictionary:
			continue
		var event := item_value as Dictionary
		var target_id := str(event.get("targetId", ""))
		if str(event.get("type", "")) != "damage" or not positions.has(target_id):
			continue
		var event_target := (positions[target_id] as Vector2) + Vector2(0.0, -154.0 - popup_progress * 35.0)
		draw_string(ThemeDB.fallback_font, event_target, "-%d" % int(event.get("amount", 0)), HORIZONTAL_ALIGNMENT_CENTER, 100.0, 26, Color(GOLD, 1.0 - popup_progress))


func _environment(snapshot: Dictionary) -> Dictionary:
	var bridge := snapshot.get("bridge", {}) as Dictionary
	return (bridge.get("encounter", {}) as Dictionary).get("environment", {}) as Dictionary


func _environment_texture(snapshot: Dictionary, layer_id: String) -> Texture2D:
	if bool(snapshot.get("opening_mode", false)):
		return null
	var textures_value: Variant = snapshot.get("environment_textures")
	if not textures_value is Dictionary:
		return null
	var texture_value: Variant = (textures_value as Dictionary).get(layer_id)
	return texture_value as Texture2D if texture_value is Texture2D else null


func _draw_virimonde_backdrop(snapshot: Dictionary) -> void:
	var beat := snapshot.get("opening_beat", {}) as Dictionary
	var environment_state := str(beat.get("environmentState", "ordinary"))
	if environment_state == "yacht_safety":
		for band in range(36):
			var ratio := float(band) / 35.0
			draw_rect(Rect2(0.0, ratio * 820.0, DESIGN_SIZE.x, 25.0), Color("#050812").lerp(Color("#17263c"), ratio * 0.72))
		for star_index in range(90):
			var x := float((star_index * 173 + 47) % 1900) + 10.0
			var y := float((star_index * 97 + 31) % 670) + 18.0
			draw_circle(Vector2(x, y), 1.0 + float(star_index % 3) * 0.45, Color(0.82, 0.9, 1.0, 0.46))
		# Virimonde remains a whole world behind the party, with a thin atmosphere and
		# a restrained night-side terminator rather than a symbolic green arc.
		draw_circle(Vector2(505.0, 860.0), 316.0, Color("#203442"))
		draw_circle(Vector2(452.0, 822.0), 300.0, Color("#55745d"))
		draw_colored_polygon(PackedVector2Array([
			Vector2(170.0, 785.0), Vector2(310.0, 662.0), Vector2(466.0, 694.0),
			Vector2(590.0, 620.0), Vector2(720.0, 704.0), Vector2(742.0, 880.0),
			Vector2(244.0, 930.0),
		]), Color(0.35, 0.5, 0.37, 0.58))
		draw_arc(Vector2(452.0, 822.0), 305.0, 0.0, TAU, 96, Color(0.55, 0.8, 0.75, 0.22), 9.0)
		# The yacht interior frames Virimonde through one broad observation port and
		# keeps enough dark architecture to make the safety feel temporary.
		draw_colored_polygon(PackedVector2Array([
			Vector2(0.0, 0.0), Vector2(245.0, 0.0), Vector2(395.0, 760.0), Vector2(0.0, 760.0),
		]), Color("#101820"))
		draw_colored_polygon(PackedVector2Array([
			Vector2(1920.0, 0.0), Vector2(1675.0, 0.0), Vector2(1525.0, 760.0), Vector2(1920.0, 760.0),
		]), Color("#101820"))
		draw_rect(Rect2(0.0, 0.0, 1920.0, 82.0), Color("#0b1118"))
		draw_colored_polygon(PackedVector2Array([
			Vector2(245.0, 0.0), Vector2(315.0, 0.0), Vector2(478.0, 760.0), Vector2(395.0, 760.0),
		]), Color("#18242b"))
		draw_colored_polygon(PackedVector2Array([
			Vector2(1675.0, 0.0), Vector2(1605.0, 0.0), Vector2(1442.0, 760.0), Vector2(1525.0, 760.0),
		]), Color("#18242b"))
		draw_line(Vector2(395.0, 760.0), Vector2(1525.0, 760.0), Color("#5f8997"), 8.0)
		draw_line(Vector2(425.0, 744.0), Vector2(1495.0, 744.0), Color(0.91, 0.72, 0.31, 0.16), 3.0)
		for console_index in range(4):
			var console_x := 585.0 + float(console_index) * 250.0
			draw_colored_polygon(PackedVector2Array([
				Vector2(console_x, 748.0), Vector2(console_x + 168.0, 748.0),
				Vector2(console_x + 138.0, 700.0), Vector2(console_x + 30.0, 700.0),
			]), Color(0.05, 0.09, 0.12, 0.86))
			draw_line(Vector2(console_x + 45.0, 714.0), Vector2(console_x + 122.0, 714.0), Color(0.36, 0.78, 0.78, 0.25), 4.0)
		return

	var sky_top := Color("#6d8b9d")
	var sky_bottom := Color("#ddcba2")
	if environment_state in ["lockdown", "standing_passage", "flyer_wreck"]:
		sky_top = Color("#4f606d")
		sky_bottom = Color("#a9947c")
	elif environment_state == "escape_pod_impact":
		sky_top = Color("#5f6873")
		sky_bottom = Color("#cf9464")
	elif environment_state in ["lake_route", "lake_approach", "lake_departure"]:
		sky_top = Color("#42586d")
		sky_bottom = Color("#c67d52")
	for band in range(48):
		var ratio := float(band) / 47.0
		draw_rect(Rect2(0.0, ratio * 760.0, DESIGN_SIZE.x, 18.0), sky_top.lerp(sky_bottom, ratio))

	# One broad, restrained source gives the pastoral plate a real atmosphere and
	# preserves the upper field for UI rather than turning the sky into decoration.
	var sun_color := Color("#f4c982") if environment_state != "escape_pod_impact" else Color("#f2a061")
	draw_colored_polygon(PackedVector2Array([
		Vector2(1410.0, 0.0), Vector2(1675.0, 0.0), Vector2(1840.0, 655.0), Vector2(1295.0, 655.0),
	]), Color(sun_color, 0.022))
	draw_circle(Vector2(1515.0, 245.0), 88.0, Color(sun_color, 0.105))
	draw_circle(Vector2(1486.0, 224.0), 142.0, Color(sun_color, 0.017))
	draw_line(Vector2(1080.0, 390.0), Vector2(1880.0, 330.0), Color(sun_color, 0.026), 31.0)
	for cloud_index in range(5):
		var cloud_y := 205.0 + float(cloud_index) * 61.0
		var cloud_x := 165.0 + float((cloud_index * 347) % 620)
		draw_line(
			Vector2(cloud_x, cloud_y),
			Vector2(cloud_x + 470.0 + float(cloud_index % 2) * 170.0, cloud_y - 16.0),
			Color(0.78, 0.84, 0.82, 0.045),
			18.0 + float(cloud_index % 3) * 7.0
		)

	# Three independently shaped ranges create aerial perspective. Their peaks do
	# not repeat, so the Standing reads inside a world rather than against a cutout.
	draw_colored_polygon(PackedVector2Array([
		Vector2(0.0, 590.0), Vector2(150.0, 505.0), Vector2(325.0, 548.0),
		Vector2(500.0, 455.0), Vector2(705.0, 540.0), Vector2(915.0, 425.0),
		Vector2(1120.0, 540.0), Vector2(1315.0, 470.0), Vector2(1510.0, 535.0),
		Vector2(1730.0, 442.0), Vector2(1920.0, 530.0), Vector2(1920.0, 690.0),
		Vector2(0.0, 690.0),
	]), Color(sky_top.darkened(0.13), 0.66))
	draw_colored_polygon(PackedVector2Array([
		Vector2(0.0, 635.0), Vector2(220.0, 474.0), Vector2(430.0, 558.0),
		Vector2(690.0, 430.0), Vector2(930.0, 552.0), Vector2(1190.0, 458.0),
		Vector2(1480.0, 548.0), Vector2(1700.0, 441.0), Vector2(1920.0, 562.0),
		Vector2(1920.0, 735.0), Vector2(0.0, 735.0),
	]), Color("#2e4944"))
	draw_colored_polygon(PackedVector2Array([
		Vector2(0.0, 680.0), Vector2(245.0, 578.0), Vector2(515.0, 646.0),
		Vector2(795.0, 548.0), Vector2(1080.0, 636.0), Vector2(1385.0, 562.0),
		Vector2(1650.0, 628.0), Vector2(1920.0, 572.0), Vector2(1920.0, 790.0),
		Vector2(0.0, 790.0),
	]), Color("#526b48"))
	for ridge_index in range(4):
		var ridge_y := 602.0 + float(ridge_index) * 31.0
		draw_line(Vector2(0.0, ridge_y), Vector2(1920.0, ridge_y + 8.0), Color(0.66, 0.73, 0.51, 0.075), 6.0)

	# Broad alternating crop masses carry the pastoral food-world identity at the
	# scale of fields; thin rows are retained only as secondary texture.
	for field_index in range(7):
		var field_top := 625.0 + float(field_index) * 23.0
		var field_color := Color("#5e774b") if field_index % 2 == 0 else Color("#4b6542")
		draw_colored_polygon(PackedVector2Array([
			Vector2(0.0, field_top + float(field_index % 2) * 8.0),
			Vector2(960.0, field_top - 18.0),
			Vector2(1920.0, field_top + float((field_index + 1) % 2) * 9.0),
			Vector2(1920.0, field_top + 27.0),
			Vector2(960.0, field_top + 13.0),
			Vector2(0.0, field_top + 31.0),
		]), Color(field_color, 0.5))
	var objective_key := str(beat.get("objectiveKey", ""))
	if objective_key in ["opening.familiar_virimonde", "opening.death_order"]:
		_draw_deathstalker_standing(objective_key == "opening.death_order")
	# The river bend and old stone boundary serve as the ordinary-world orientation anchor.
	draw_line(Vector2(0.0, 704.0), Vector2(1920.0, 724.0), Color(0.12, 0.22, 0.18, 0.24), 17.0)
	draw_colored_polygon(PackedVector2Array([
		Vector2(0.0, 720.0), Vector2(300.0, 680.0), Vector2(610.0, 725.0),
		Vector2(920.0, 690.0), Vector2(1260.0, 730.0), Vector2(1520.0, 700.0),
		Vector2(1920.0, 735.0), Vector2(1920.0, 765.0), Vector2(1500.0, 735.0),
		Vector2(1240.0, 763.0), Vector2(900.0, 725.0), Vector2(610.0, 758.0),
		Vector2(290.0, 715.0), Vector2(0.0, 755.0),
	]), Color(0.25, 0.49, 0.55, 0.48))
	draw_line(Vector2(0.0, 731.0), Vector2(300.0, 694.0), Color(0.66, 0.82, 0.78, 0.18), 3.0)
	draw_line(Vector2(610.0, 740.0), Vector2(920.0, 706.0), Color(0.66, 0.82, 0.78, 0.14), 3.0)
	draw_line(Vector2(1240.0, 746.0), Vector2(1520.0, 716.0), Color(0.66, 0.82, 0.78, 0.12), 3.0)
	for stone_index in range(16):
		var x := 58.0 + float(stone_index) * 122.0
		var y := 687.0 + sin(float(stone_index) * 1.7) * 13.0
		var width := 50.0 + float(stone_index % 4) * 7.0
		draw_rect(Rect2(x + 4.0, y + 6.0, width, 17.0), Color(0.08, 0.09, 0.075, 0.28))
		draw_rect(Rect2(x, y, width, 18.0), Color("#666454"))
		draw_line(Vector2(x + 4.0, y + 4.0), Vector2(x + width - 5.0, y + 4.0), Color(0.78, 0.77, 0.63, 0.15), 2.0)
	_draw_source_sequence_landmarks(environment_state)

	if environment_state in ["lockdown", "standing_passage"]:
		for pylon_index in range(5):
			var x := 1180.0 + float(pylon_index) * 145.0
			draw_colored_polygon(PackedVector2Array([
				Vector2(x, 675.0), Vector2(x + 28.0, 470.0), Vector2(x + 58.0, 675.0),
			]), Color(0.08, 0.1, 0.13, 0.82))
		draw_line(Vector2(1120.0, 670.0), Vector2(1920.0, 610.0), Color(0.74, 0.28, 0.2, 0.38), 5.0)

	if environment_state == "escape_pod_impact":
		# Offset elliptical lobes and a torn shear layer avoid the visibly concentric
		# placeholder-smoke construction while retaining the impact's vertical read.
		for smoke_index in range(9):
			var smoke_center := Vector2(
				1320.0 + sin(float(smoke_index) * 1.67) * (36.0 + float(smoke_index) * 5.0),
				650.0 - float(smoke_index) * 45.0
			)
			var smoke_radii := Vector2(76.0 + float(smoke_index % 4) * 22.0, 42.0 + float((smoke_index + 2) % 3) * 17.0)
			_draw_ellipse_shape(smoke_center, smoke_radii, Color(0.11, 0.105, 0.11, 0.065 + float(smoke_index) * 0.008))
		draw_colored_polygon(PackedVector2Array([
			Vector2(1210.0, 616.0), Vector2(1302.0, 535.0), Vector2(1388.0, 314.0),
			Vector2(1454.0, 250.0), Vector2(1408.0, 548.0), Vector2(1372.0, 660.0),
		]), Color(0.08, 0.075, 0.08, 0.12))
		_draw_ellipse_shape(Vector2(1325.0, 675.0), Vector2(94.0, 56.0), Color(1.0, 0.34, 0.08, 0.24))
		draw_line(Vector2(1050.0, 490.0), Vector2(1340.0, 670.0), Color(1.0, 0.67, 0.26, 0.42), 12.0)


func _draw_source_sequence_landmarks(environment_state: String) -> void:
	if environment_state == "standing_passage":
		# A compressed, old service passage under the Standing releases toward an
		# exterior hangar. Repeated arches and diminishing lamps carry the escape axis.
		draw_rect(Rect2(265.0, 520.0, 620.0, 218.0), Color(0.12, 0.14, 0.13, 0.82))
		for retaining_index in range(5):
			var retaining_x := 285.0 + float(retaining_index) * 112.0
			draw_rect(Rect2(retaining_x, 542.0, 86.0, 176.0), Color(0.2, 0.22, 0.2, 0.62))
			draw_line(Vector2(retaining_x + 9.0, 554.0), Vector2(retaining_x + 9.0, 706.0), Color(0.55, 0.56, 0.49, 0.12), 3.0)
		draw_colored_polygon(PackedVector2Array([
			Vector2(330.0, 730.0), Vector2(570.0, 480.0), Vector2(825.0, 730.0),
		]), Color(0.055, 0.07, 0.07, 0.96))
		for arch_index in range(4):
			var arch_radius := 196.0 - float(arch_index) * 35.0
			var arch_y := 730.0 - float(arch_index) * 8.0
			draw_arc(Vector2(575.0, arch_y), arch_radius, PI, TAU, 42, Color(0.42, 0.44, 0.38, 0.34 - float(arch_index) * 0.055), 16.0)
			draw_circle(Vector2(575.0, 660.0 - float(arch_index) * 39.0), 4.0, Color(0.92, 0.59, 0.22, 0.52))
		draw_line(Vector2(575.0, 548.0), Vector2(575.0, 730.0), Color("#a74439"), 4.0)
		draw_colored_polygon(PackedVector2Array([
			Vector2(815.0, 730.0), Vector2(1005.0, 615.0), Vector2(1360.0, 646.0),
			Vector2(1390.0, 730.0),
		]), Color(0.16, 0.19, 0.18, 0.62))
		_draw_private_flyer(Vector2(1225.0, 700.0), false)
	elif environment_state in ["flyer_wreck", "escape_pod_impact"]:
		_draw_windbreak_tree(Vector2(760.0, 718.0))
		for smoke_index in range(7):
			var smoke_center := Vector2(1012.0 + sin(float(smoke_index) * 1.83) * 37.0, 590.0 - float(smoke_index) * 34.0)
			var smoke_radii := Vector2(48.0 + float(smoke_index % 3) * 18.0, 29.0 + float((smoke_index + 1) % 3) * 13.0)
			_draw_ellipse_shape(smoke_center, smoke_radii, Color(0.075, 0.08, 0.075, 0.055 + float(smoke_index) * 0.008))
		_draw_private_flyer(Vector2(965.0, 724.0), true)
		if environment_state == "escape_pod_impact":
			_draw_escape_pod(Vector2(1330.0, 718.0))
	elif environment_state in ["lake_route", "lake_approach", "lake_departure"]:
		draw_colored_polygon(PackedVector2Array([
			Vector2(0.0, 600.0), Vector2(1920.0, 570.0), Vector2(1920.0, 790.0),
			Vector2(0.0, 825.0),
		]), Color(0.12, 0.32, 0.4, 0.72))
		draw_line(Vector2(0.0, 602.0), Vector2(1920.0, 572.0), Color(0.68, 0.78, 0.66, 0.18), 6.0)
		for lake_line in range(9):
			var y := 614.0 + float(lake_line) * 21.0
			var line_start := float((lake_line * 173) % 420)
			draw_line(Vector2(line_start, y), Vector2(1920.0 - line_start * 0.35, y - 17.0), Color(0.55, 0.76, 0.76, 0.105 + float(lake_line % 3) * 0.018), 3.0)
		if environment_state == "lake_departure":
			_draw_hidden_yacht(Vector2(1220.0, 690.0))


func _draw_windbreak_tree(base: Vector2) -> void:
	# A real windbreak line explains why the wreck site is spatially distinct while
	# one foreground trunk remains Owen's readable last-stand anchor.
	for tree_index in range(7):
		var offset_x := -248.0 + float(tree_index) * 82.0
		var depth_scale := 0.68 + float(tree_index % 3) * 0.08
		var trunk_height := 160.0 + float(tree_index % 4) * 20.0
		var trunk_width := 22.0 + float(tree_index % 2) * 7.0
		var tree_base := base + Vector2(offset_x, 0.0)
		draw_rect(Rect2(tree_base + Vector2(-trunk_width * 0.5, -trunk_height), Vector2(trunk_width, trunk_height)), Color("#40352a").darkened(float(tree_index % 3) * 0.04))
		for canopy_index in range(5):
			var canopy_angle := TAU * float(canopy_index) / 5.0 + float(tree_index) * 0.31
			var canopy_center := tree_base + Vector2(cos(canopy_angle) * 43.0, -trunk_height - 40.0 + sin(canopy_angle) * 31.0)
			draw_circle(canopy_center, 58.0 * depth_scale, Color("#263d2d").lightened(float(tree_index % 2) * 0.025))
	# The anchor tree is broader, scarred, and asymmetric.
	draw_rect(Rect2(base + Vector2(-28.0, -238.0), Vector2(56.0, 238.0)), Color("#3d3128"))
	draw_line(base + Vector2(-5.0, -205.0), base + Vector2(-62.0, -294.0), Color("#3d3128"), 22.0)
	for crown_index in range(8):
		var crown_angle := TAU * float(crown_index) / 8.0
		var crown_center := base + Vector2(cos(crown_angle) * 76.0 - 16.0, -248.0 + sin(crown_angle) * 46.0)
		draw_circle(crown_center, 70.0, Color("#20382a"))


func _draw_private_flyer(base: Vector2, wrecked: bool) -> void:
	var tilt := -0.16 if wrecked else 0.0
	draw_set_transform(base, tilt, Vector2.ONE)
	# A long atmospheric lifting body with swept control planes remains visually
	# distinct from the blunt escape pod and much larger hidden yacht.
	draw_colored_polygon(PackedVector2Array([
		Vector2(-164.0, -2.0), Vector2(-108.0, -48.0), Vector2(28.0, -62.0),
		Vector2(160.0, -18.0), Vector2(124.0, 12.0), Vector2(-118.0, 24.0),
	]), Color("#2c363e"))
	draw_colored_polygon(PackedVector2Array([
		Vector2(-92.0, -45.0), Vector2(-48.0, -89.0), Vector2(38.0, -92.0),
		Vector2(88.0, -55.0), Vector2(28.0, -62.0),
	]), Color("#647d86"))
	draw_colored_polygon(PackedVector2Array([
		Vector2(-82.0, -22.0), Vector2(-210.0, 18.0), Vector2(-122.0, 31.0), Vector2(18.0, -5.0),
	]), Color("#39474e"))
	draw_colored_polygon(PackedVector2Array([
		Vector2(58.0, -22.0), Vector2(200.0, 5.0), Vector2(130.0, 24.0), Vector2(-8.0, -3.0),
	]), Color("#39474e"))
	for engine_index in [-1.0, 1.0]:
		draw_rect(Rect2(Vector2(-115.0 + engine_index * 54.0, 4.0), Vector2(38.0, 20.0)), Color("#172028"))
		draw_line(Vector2(-108.0 + engine_index * 54.0, 17.0), Vector2(-83.0 + engine_index * 54.0, 17.0), Color(0.48, 0.82, 0.84, 0.3), 4.0)
	draw_line(Vector2(-148.0, -1.0), Vector2(142.0, -17.0), Color("#aeb7b2"), 4.0)
	draw_line(Vector2(-52.0, -82.0), Vector2(32.0, -85.0), Color(0.62, 0.85, 0.86, 0.28), 4.0)
	if wrecked:
		draw_colored_polygon(PackedVector2Array([
			Vector2(72.0, -18.0), Vector2(192.0, 14.0), Vector2(122.0, 31.0), Vector2(36.0, 5.0),
		]), Color("#211b1b"))
		draw_circle(Vector2(82.0, -24.0), 42.0, Color(1.0, 0.22, 0.045, 0.34))
		draw_circle(Vector2(70.0, -31.0), 17.0, Color(1.0, 0.64, 0.16, 0.56))
		draw_line(Vector2(68.0, -32.0), Vector2(112.0, -132.0), Color(1.0, 0.42, 0.09, 0.48), 15.0)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


func _draw_escape_pod(base: Vector2) -> void:
	draw_set_transform(base, 0.12, Vector2.ONE)
	_draw_ellipse_shape(Vector2(8.0, 9.0), Vector2(154.0, 29.0), Color(0.11, 0.075, 0.045, 0.44))
	draw_arc(Vector2(8.0, 9.0), 151.0, PI + 0.08, TAU - 0.08, 48, Color(0.65, 0.31, 0.16, 0.3), 8.0)
	draw_colored_polygon(PackedVector2Array([
		Vector2(-138.0, 0.0), Vector2(-110.0, -106.0), Vector2(-62.0, -146.0),
		Vector2(76.0, -133.0), Vector2(132.0, -58.0), Vector2(145.0, 0.0),
	]), Color("#353b3d"))
	draw_colored_polygon(PackedVector2Array([
		Vector2(-75.0, -126.0), Vector2(-42.0, -168.0), Vector2(52.0, -158.0), Vector2(82.0, -130.0),
	]), Color("#59656a"))
	draw_rect(Rect2(Vector2(-62.0, -106.0), Vector2(118.0, 78.0)), Color("#151b1e"))
	draw_rect(Rect2(Vector2(-62.0, -106.0), Vector2(118.0, 78.0)), Color("#9b5b3d"), false, 5.0)
	draw_line(Vector2(-138.0, 0.0), Vector2(145.0, 0.0), Color("#c17343"), 7.0)
	draw_line(Vector2(-104.0, -112.0), Vector2(104.0, -122.0), Color(0.72, 0.76, 0.69, 0.22), 4.0)
	for scorch_index in range(4):
		draw_line(
			Vector2(-92.0 + float(scorch_index) * 53.0, -124.0),
			Vector2(-64.0 + float(scorch_index) * 45.0, -18.0),
			Color(0.05, 0.04, 0.035, 0.62),
			7.0
		)
	draw_circle(Vector2(109.0, -45.0), 11.0, Color(1.0, 0.38, 0.08, 0.56))
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


func _draw_hidden_yacht(base: Vector2) -> void:
	# The yacht is a broad, durable departure anchor: longer, calmer, and more
	# architectural than either rescue craft.
	for wake_index in range(6):
		var wake_y := 4.0 + float(wake_index) * 14.0
		var wake_inset := float(wake_index) * 38.0
		draw_line(
			base + Vector2(-370.0 + wake_inset, wake_y),
			base + Vector2(-155.0 + wake_inset * 0.38, wake_y + 5.0),
			Color(0.5, 0.82, 0.86, 0.14 - float(wake_index) * 0.015),
			5.0
		)
		draw_line(
			base + Vector2(370.0 - wake_inset, wake_y - 3.0),
			base + Vector2(160.0 - wake_inset * 0.34, wake_y + 4.0),
			Color(0.5, 0.82, 0.86, 0.14 - float(wake_index) * 0.015),
			5.0
		)
	draw_arc(base + Vector2(0.0, 10.0), 338.0, PI + 0.18, TAU - 0.18, 68, Color(0.5, 0.82, 0.86, 0.08), 6.0)
	draw_colored_polygon(PackedVector2Array([
		base + Vector2(-310.0, 0.0), base + Vector2(-205.0, -66.0),
		base + Vector2(138.0, -92.0), base + Vector2(310.0, -7.0),
		base + Vector2(246.0, 30.0), base + Vector2(-252.0, 35.0),
	]), Color("#343e46"))
	draw_colored_polygon(PackedVector2Array([
		base + Vector2(-116.0, -78.0), base + Vector2(-48.0, -148.0),
		base + Vector2(92.0, -142.0), base + Vector2(172.0, -86.0),
	]), Color("#73868e"))
	draw_colored_polygon(PackedVector2Array([
		base + Vector2(-36.0, -143.0), base + Vector2(8.0, -176.0),
		base + Vector2(102.0, -168.0), base + Vector2(128.0, -137.0),
	]), Color("#26343d"))
	draw_line(base + Vector2(-296.0, -2.0), base + Vector2(294.0, -10.0), Color("#d6b85d"), 7.0)
	draw_line(base + Vector2(-210.0, 20.0), base + Vector2(230.0, 19.0), Color(0.4, 0.78, 0.82, 0.28), 4.0)
	for port_index in range(5):
		var port_x := -105.0 + float(port_index) * 48.0
		draw_rect(Rect2(base + Vector2(port_x, -78.0), Vector2(29.0, 10.0)), Color(0.66, 0.89, 0.87, 0.34))


func _draw_deathstalker_standing(betrayed: bool) -> void:
	var stone := Color("#50584f")
	var shadow := Color("#28332e")
	var roof := Color("#243139")
	var warm := Color("#9d352e") if betrayed else Color("#edc273")
	# A restrained old aristocratic estate, assembled from a central hall, inhabited
	# wings, service depth, retaining terrace, and one ceremonial threshold.
	draw_rect(Rect2(640.0, 575.0, 640.0, 67.0), Color(shadow.darkened(0.08), 0.96))
	draw_colored_polygon(PackedVector2Array([
		Vector2(642.0, 575.0), Vector2(720.0, 522.0), Vector2(1200.0, 522.0), Vector2(1280.0, 575.0),
	]), Color(shadow, 0.92))
	draw_rect(Rect2(690.0, 520.0, 190.0, 118.0), stone.darkened(0.04))
	draw_rect(Rect2(1040.0, 520.0, 190.0, 118.0), stone.darkened(0.04))
	draw_rect(Rect2(835.0, 442.0, 250.0, 196.0), stone)
	draw_rect(Rect2(772.0, 490.0, 105.0, 148.0), stone.lightened(0.025))
	draw_rect(Rect2(1043.0, 490.0, 105.0, 148.0), stone.lightened(0.025))
	draw_colored_polygon(PackedVector2Array([
		Vector2(674.0, 520.0), Vector2(785.0, 475.0), Vector2(897.0, 520.0),
	]), roof)
	draw_colored_polygon(PackedVector2Array([
		Vector2(1023.0, 520.0), Vector2(1135.0, 475.0), Vector2(1246.0, 520.0),
	]), roof)
	draw_colored_polygon(PackedVector2Array([
		Vector2(804.0, 442.0), Vector2(960.0, 376.0), Vector2(1116.0, 442.0),
	]), roof.darkened(0.05))
	draw_rect(Rect2(907.0, 500.0, 106.0, 138.0), shadow.darkened(0.08))
	draw_arc(Vector2(960.0, 505.0), 53.0, PI, TAU, 28, stone.lightened(0.1), 14.0)
	for masonry_row in range(5):
		var masonry_y := 458.0 + float(masonry_row) * 34.0
		draw_line(Vector2(844.0, masonry_y), Vector2(1076.0, masonry_y), Color(0.72, 0.73, 0.63, 0.075), 2.0)
	for wing_index in range(2):
		var wing_start := 712.0 if wing_index == 0 else 1062.0
		for window_index in range(4):
			var window_x := wing_start + float(window_index) * 39.0
			draw_rect(Rect2(window_x, 548.0, 15.0, 32.0), Color(warm, 0.52))
			draw_rect(Rect2(window_x - 3.0, 544.0, 21.0, 40.0), Color(stone.darkened(0.18), 0.52), false, 3.0)
	for center_window in range(3):
		var center_x := 870.0 + float(center_window) * 79.0
		draw_rect(Rect2(center_x, 470.0, 22.0, 42.0), Color(warm, 0.62))
		draw_arc(Vector2(center_x + 11.0, 470.0), 11.0, PI, TAU, 16, Color(stone.lightened(0.1), 0.72), 4.0)
	draw_line(Vector2(640.0, 638.0), Vector2(1280.0, 638.0), Color(warm, 0.16), 3.0)
	for buttress_index in range(5):
		var buttress_x := 670.0 + float(buttress_index) * 145.0
		draw_colored_polygon(PackedVector2Array([
			Vector2(buttress_x, 638.0), Vector2(buttress_x + 26.0, 590.0), Vector2(buttress_x + 46.0, 638.0),
		]), Color(stone.darkened(0.15), 0.7))
	if betrayed:
		draw_rect(Rect2(907.0, 500.0, 106.0, 138.0), Color("#11171a"))
		for gate_bar in range(7):
			var gate_x := 915.0 + float(gate_bar) * 15.0
			draw_line(Vector2(gate_x, 506.0), Vector2(gate_x, 638.0), Color("#491f20"), 5.0)
		draw_line(Vector2(914.0, 571.0), Vector2(1006.0, 571.0), Color("#a4433c"), 4.0)
		draw_circle(Vector2(960.0, 571.0), 10.0, Color("#d55b49"))
	# The approved old stone-and-river orientation point frames the familiar crossing.
	for pier_x in [875.0, 1045.0]:
		draw_rect(Rect2(pier_x, 653.0, 34.0, 76.0), Color("#656455"))
		draw_colored_polygon(PackedVector2Array([
			Vector2(pier_x - 5.0, 653.0),
			Vector2(pier_x + 17.0, 635.0),
			Vector2(pier_x + 39.0, 653.0),
		]), Color("#74715f"))
		draw_line(Vector2(pier_x + 8.0, 665.0), Vector2(pier_x + 8.0, 715.0), Color(0.75, 0.78, 0.65, 0.14), 4.0)


func _draw_virimonde_stage_floor(snapshot: Dictionary) -> void:
	var beat := snapshot.get("opening_beat", {}) as Dictionary
	var environment_state := str(beat.get("environmentState", "ordinary"))
	if environment_state == "yacht_safety":
		draw_rect(Rect2(0.0, 760.0, 1920.0, 320.0), Color("#09111b"))
		draw_colored_polygon(PackedVector2Array([
			Vector2(430.0, 760.0), Vector2(1490.0, 760.0), Vector2(1740.0, 1080.0), Vector2(180.0, 1080.0),
		]), Color(0.07, 0.12, 0.16, 0.82))
		draw_colored_polygon(PackedVector2Array([
			Vector2(780.0, 760.0), Vector2(1140.0, 760.0), Vector2(1270.0, 1080.0), Vector2(650.0, 1080.0),
		]), Color(0.09, 0.16, 0.2, 0.72))
		for line_index in range(10):
			draw_line(Vector2(960.0, 750.0), Vector2(float(line_index) * 225.0 - 45.0, 1080.0), Color(0.35, 0.58, 0.72, 0.085), 2.0)
		for deck_row in range(5):
			var deck_ratio := float(deck_row) / 4.0
			var deck_y := lerpf(792.0, 1062.0, pow(deck_ratio, 1.5))
			draw_line(Vector2(180.0, deck_y), Vector2(1740.0, deck_y), Color(0.42, 0.66, 0.72, 0.08), 3.0)
		draw_line(Vector2(500.0, 774.0), Vector2(250.0, 1080.0), Color(0.84, 0.66, 0.28, 0.12), 4.0)
		draw_line(Vector2(1420.0, 774.0), Vector2(1670.0, 1080.0), Color(0.84, 0.66, 0.28, 0.12), 4.0)
		return
	var floor_color := Color("#37492f")
	if environment_state in ["standing_passage", "flyer_wreck"]:
		floor_color = Color("#3f443b")
	elif environment_state == "escape_pod_impact":
		floor_color = Color("#443e31")
	elif environment_state in ["lake_route", "lake_approach", "lake_departure"]:
		floor_color = Color("#36433b")
	for band in range(12):
		var ratio := float(band) / 11.0
		draw_rect(Rect2(0.0, 748.0 + float(band) * 29.0, 1920.0, 31.0), floor_color.darkened(ratio * 0.48))
	var vanishing := Vector2(960.0, 720.0)
	# Alternating land parcels converge toward the route while a darker outer field
	# keeps the center readable. These are broad masses, not a luminous debug grid.
	for parcel_index in range(8):
		var left_bottom := float(parcel_index) * 240.0
		var right_bottom := left_bottom + 214.0
		var top_left := lerpf(920.0, 1000.0, float(parcel_index) / 7.0)
		var parcel_color := floor_color.lightened(0.045) if parcel_index % 2 == 0 else floor_color.darkened(0.055)
		draw_colored_polygon(PackedVector2Array([
			Vector2(top_left - 19.0, 748.0), Vector2(top_left + 19.0, 748.0),
			Vector2(right_bottom, 1080.0), Vector2(left_bottom, 1080.0),
		]), Color(parcel_color, 0.35))
	draw_colored_polygon(PackedVector2Array([
		vanishing + Vector2(-58.0, 0.0), vanishing + Vector2(58.0, 0.0),
		Vector2(1265.0, 1080.0), Vector2(595.0, 1080.0),
	]), Color(0.43, 0.38, 0.27, 0.58))
	draw_line(vanishing + Vector2(-58.0, 2.0), Vector2(595.0, 1080.0), Color(0.75, 0.69, 0.47, 0.2), 4.0)
	draw_line(vanishing + Vector2(58.0, 2.0), Vector2(1265.0, 1080.0), Color(0.75, 0.69, 0.47, 0.16), 4.0)
	for furrow_index in range(15):
		var bottom_x := float(furrow_index) * 180.0 - 120.0
		draw_line(vanishing, Vector2(bottom_x, 1080.0), Color(0.45, 0.58, 0.34, 0.11), 2.0)
	for row_index in range(7):
		var row_ratio := float(row_index) / 6.0
		var row_y := lerpf(770.0, 1065.0, pow(row_ratio, 1.62))
		draw_line(Vector2(0.0, row_y), Vector2(1920.0, row_y), Color(0.68, 0.72, 0.48, 0.085), 3.0)
	for ground_stone_index in range(26):
		var stone_x := float((ground_stone_index * 223 + 81) % 1880) + 20.0
		if absf(stone_x - 960.0) < 255.0:
			continue
		var stone_y := 812.0 + float((ground_stone_index * 71) % 245)
		var stone_radius := 3.0 + float(ground_stone_index % 4)
		_draw_ellipse_shape(Vector2(stone_x, stone_y), Vector2(stone_radius * 1.7, stone_radius), Color(0.42, 0.43, 0.34, 0.28))
	if environment_state == "flyer_wreck":
		_draw_ellipse_shape(Vector2(990.0, 766.0), Vector2(190.0, 29.0), Color(0.12, 0.09, 0.065, 0.44))
		for skid_index in range(4):
			draw_line(Vector2(840.0 + float(skid_index) * 28.0, 770.0), Vector2(650.0 + float(skid_index) * 21.0, 925.0), Color(0.12, 0.1, 0.075, 0.31), 8.0)
	elif environment_state == "escape_pod_impact":
		_draw_ellipse_shape(Vector2(1330.0, 768.0), Vector2(185.0, 37.0), Color(0.12, 0.075, 0.045, 0.54))
		draw_arc(Vector2(1330.0, 768.0), 182.0, PI + 0.09, TAU - 0.09, 56, Color(0.82, 0.3, 0.08, 0.23), 9.0)
		for debris_index in range(8):
			var debris_angle := PI + float(debris_index) / 7.0 * PI
			var debris_distance := 205.0 + float(debris_index % 3) * 31.0
			var debris_center := Vector2(1330.0, 768.0) + Vector2(cos(debris_angle) * debris_distance, sin(debris_angle) * 28.0)
			draw_rect(Rect2(debris_center, Vector2(13.0 + float(debris_index % 3) * 4.0, 7.0)), Color(0.18, 0.15, 0.12, 0.52))
	elif environment_state == "lake_departure":
		for wet_line_index in range(6):
			var wet_y := 760.0 + float(wet_line_index) * 34.0
			draw_line(Vector2(0.0, wet_y), Vector2(1920.0, wet_y - 12.0), Color(0.3, 0.6, 0.62, 0.06), 4.0)


func _draw_virimonde_foreground(snapshot: Dictionary) -> void:
	var beat := snapshot.get("opening_beat", {}) as Dictionary
	if str(beat.get("environmentState", "")) == "yacht_safety":
		draw_rect(Rect2(0.0, 1010.0, 1920.0, 70.0), Color(0.01, 0.015, 0.025, 0.76))
		return
	# Layered translucent banks approximate the selected shallow-focus foreground
	# without a full-resolution per-frame blur.
	for softness_index in range(5, -1, -1):
		var spread := float(softness_index) * 22.0
		var alpha := 0.025 + float(5 - softness_index) * 0.027
		draw_colored_polygon(PackedVector2Array([
			Vector2(-60.0 - spread, 982.0 - spread * 0.38),
			Vector2(170.0 + spread, 925.0 - spread * 0.18),
			Vector2(360.0 + spread, 1080.0), Vector2(-60.0 - spread, 1080.0),
		]), Color(0.025, 0.05, 0.03, alpha))
		draw_colored_polygon(PackedVector2Array([
			Vector2(1980.0 + spread, 978.0 - spread * 0.38),
			Vector2(1750.0 - spread, 918.0 - spread * 0.18),
			Vector2(1555.0 - spread, 1080.0), Vector2(1980.0 + spread, 1080.0),
		]), Color(0.025, 0.05, 0.03, alpha))
	for side_value: Variant in [-1.0, 1.0]:
		var side := float(side_value)
		var base_x := 80.0 if side < 0.0 else 1840.0
		for grass_index in range(18):
			var offset: float = float(grass_index) * 16.0 * side
			var tip_x := base_x + offset * 0.72 + sin(float(grass_index) * 1.9) * 18.0
			var tip_y := 955.0 - float(grass_index % 6) * 18.0
			draw_line(Vector2(base_x + offset, 1080.0), Vector2(tip_x, tip_y), Color(0.1, 0.19, 0.11, 0.48), 8.0)
	draw_colored_polygon(PackedVector2Array([
		Vector2(-40.0, 980.0), Vector2(190.0, 930.0), Vector2(330.0, 1080.0), Vector2(-40.0, 1080.0),
	]), Color(0.035, 0.065, 0.04, 0.5))
	draw_colored_polygon(PackedVector2Array([
		Vector2(1960.0, 970.0), Vector2(1740.0, 925.0), Vector2(1600.0, 1080.0), Vector2(1960.0, 1080.0),
	]), Color(0.035, 0.065, 0.04, 0.5))
	for foreground_stone_index in range(5):
		var left_x := 42.0 + float(foreground_stone_index) * 82.0
		var right_x := 1878.0 - float(foreground_stone_index) * 82.0
		var stone_y := 1016.0 + float(foreground_stone_index % 2) * 18.0
		draw_rect(Rect2(left_x, stone_y, 72.0, 48.0), Color(0.18, 0.2, 0.16, 0.38))
		draw_rect(Rect2(right_x - 72.0, stone_y, 72.0, 48.0), Color(0.18, 0.2, 0.16, 0.38))


func _opening_title(objective_key: String) -> String:
	match objective_key:
		"opening.familiar_virimonde": return "Deathstalker Standing"
		"opening.death_order": return "Imperial death order"
		"opening.standing_escape": return "Escape the Standing"
		"opening.flyer_last_stand": return "Flyer down"
		"opening.escape_pod_crash": return "Hazel crash-lands"
		"opening.escape_pod_rescue": return "Reach the escape pod"
		"opening.flight_to_lake": return "Flight to the lake"
		"opening.lake_recovery": return "Lake approach"
		"opening.hidden_yacht_departure": return "Hidden-yacht departure"
		"opening.yacht_safety": return "Temporary safety"
		_: return objective_key.replace("opening.", "").replace("_", " ").capitalize()


func _opening_objective(objective_key: String) -> String:
	match objective_key:
		"opening.familiar_virimonde": return "Approach Deathstalker Standing and inspect Owen's supplies."
		"opening.death_order": return "Standing personnel accept the authentic order and turn on Owen. No reason is supplied."
		"opening.standing_escape": return "Reach Owen's private flyer through the concealed route."
		"opening.flyer_last_stand": return "Shot down and wounded, Owen braces at the windbreak."
		"opening.escape_pod_crash": return "Hazel's crash impact scatters the Standing personnel."
		"opening.escape_pod_rescue": return "Hold the opening while Owen reaches Hazel's escape pod."
		"opening.flight_to_lake": return "Reach the lake hiding Owen's private yacht."
		"opening.lake_recovery": return "Regroup at the lake and continue toward Owen's hidden yacht."
		"opening.hidden_yacht_departure": return "Hold the lake route and board Owen's hidden yacht."
		"opening.yacht_safety": return "Review condition and supplies; Virimonde remains behind."
		_: return "Continue the opening expedition."


func _average_frame_ms(snapshot: Dictionary) -> float:
	var samples := snapshot.get("frame_samples", []) as Array
	if samples.is_empty():
		return 0.0
	var total := 0.0
	for sample_value: Variant in samples:
		total += float(sample_value)
	return total / float(samples.size())


func _layer_mask(visibility: Array) -> String:
	var mask := ""
	for layer_index in range(9):
		mask += str(layer_index + 1) if layer_index < visibility.size() and bool(visibility[layer_index]) else "-"
	return mask


func _draw_ellipse_shape(center: Vector2, radii: Vector2, color: Color) -> void:
	var points := PackedVector2Array()
	for index in range(28):
		var angle := TAU * float(index) / 28.0
		points.append(center + Vector2(cos(angle) * radii.x, sin(angle) * radii.y))
	draw_polygon(points, PackedColorArray([color]))


func _bridge_color(value: String, fallback: Color) -> Color:
	if value.begins_with("#"):
		return Color.from_string(value, fallback)
	if value.begins_with("rgba(") and value.ends_with(")"):
		var parts := value.trim_prefix("rgba(").trim_suffix(")").split(",")
		if parts.size() == 4:
			return Color(
				clampf(float(parts[0].strip_edges()) / 255.0, 0.0, 1.0),
				clampf(float(parts[1].strip_edges()) / 255.0, 0.0, 1.0),
				clampf(float(parts[2].strip_edges()) / 255.0, 0.0, 1.0),
				clampf(float(parts[3].strip_edges()), 0.0, 1.0)
			)
	return fallback
