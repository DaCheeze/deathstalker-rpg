extends Node2D

const DESIGN_SIZE := Vector2(1920.0, 1080.0)
const HALF_SIZE := Vector2(960.0, 540.0)
const PARTY_BODY := Color("#285e68")
const ENEMY_BODY := Color("#4a4255")
const CYAN := Color("#63e6ff")
const GOLD := Color("#ffcf67")
const GREEN := Color("#53f2a8")
const MUTED := Color("#a7b3c4")

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
	var environment := _environment(snapshot)
	var haze := _bridge_color(str(environment.get("hazeColor", "#25354a")), Color("#25354a"))
	var stone := _bridge_color(str(environment.get("stoneColor", "#343948")), Color("#343948"))
	for index in range(9):
		var x := 80.0 + float(index) * 236.0
		var height := 390.0 + float(index % 3) * 72.0
		draw_rect(Rect2(x, 205.0, 112.0, height), Color(stone, 0.62))
		draw_rect(Rect2(x + 18.0, 228.0, 8.0, height - 44.0), Color(haze.lightened(0.22), 0.25))
	for index in range(5):
		var arch_x := 260.0 + float(index) * 350.0
		draw_arc(Vector2(arch_x, 590.0), 165.0, PI, TAU, 48, Color(stone, 0.48), 42.0)
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
	var environment := _environment(snapshot)
	var floor_tint := _bridge_color(str(environment.get("floorTint", "#202530")), Color("#202530"))
	var metal := _bridge_color(str(environment.get("metalColor", "#252c3a")), Color("#252c3a"))
	var accent := _bridge_color(str(environment.get("accentColor", "#63e6ff")), CYAN)
	draw_rect(Rect2(0.0, 770.0, DESIGN_SIZE.x, 310.0), floor_tint)
	var vanishing := Vector2(960.0, 735.0)
	for index in range(15):
		var bottom_x := float(index) * 150.0 - 90.0
		draw_line(vanishing, Vector2(bottom_x, 1080.0), Color(metal.lightened(0.24), 0.28), 2.0)
	for row in range(8):
		var ratio := float(row) / 7.0
		var y := lerpf(788.0, 1080.0, pow(ratio, 1.7))
		draw_line(Vector2(0.0, y), Vector2(1920.0, y), Color(metal.lightened(0.24), 0.24), 2.0)
	draw_line(Vector2(0.0, 790.0), Vector2(1920.0, 790.0), Color(accent, 0.32), 3.0)


func _draw_unit_layer(snapshot: Dictionary, requested_side: String) -> void:
	var state := snapshot.get("state", {}) as Dictionary
	var positions := snapshot.get("positions", {}) as Dictionary
	var combatants := state.get("combatants", []) as Array
	var playback_seconds := float(snapshot.get("playback_seconds", 0.0))
	for item_value: Variant in combatants:
		if not item_value is Dictionary:
			continue
		var combatant := item_value as Dictionary
		if str(combatant.get("side", "enemy")) != requested_side:
			continue
		var combatant_id := str(combatant.get("id", ""))
		if not positions.has(combatant_id):
			continue
		_draw_unit_body(positions[combatant_id] as Vector2, combatant, playback_seconds)


func _draw_unit_body(position: Vector2, combatant: Dictionary, playback_seconds: float) -> void:
	var side := str(combatant.get("side", "enemy"))
	var body := PARTY_BODY if side == "party" else ENEMY_BODY
	var alive := bool(combatant.get("alive", true))
	if not alive:
		body = body.darkened(0.62)
	var bob := sin(playback_seconds * 2.0 + position.x * 0.009) * 2.5 if alive else 0.0
	var base := position + Vector2(0.0, bob)
	_draw_ellipse_shape(base + Vector2(0.0, 24.0), Vector2(68.0, 15.0), Color(0.0, 0.0, 0.0, 0.48))
	draw_rect(Rect2(base.x - 41.0, base.y - 130.0, 82.0, 130.0), body)
	draw_polygon(PackedVector2Array([
		base + Vector2(-52.0, -116.0),
		base + Vector2(0.0, -156.0),
		base + Vector2(52.0, -116.0),
		base + Vector2(34.0, -86.0),
		base + Vector2(-34.0, -86.0),
	]), PackedColorArray([body.lightened(0.1)]))
	draw_rect(Rect2(base.x - 27.0, base.y - 110.0, 54.0, 66.0), body.lightened(0.13))
	draw_rect(Rect2(base.x - 55.0, base.y - 105.0, 15.0, 73.0), body.darkened(0.14))
	draw_rect(Rect2(base.x + 40.0, base.y - 105.0, 15.0, 73.0), body.darkened(0.14))
	var facing := -1.0 if side == "party" else 1.0
	draw_line(base + Vector2(facing * 47.0, -88.0), base + Vector2(facing * 78.0, -22.0), Color("#8c98a7"), 8.0)


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
			_draw_unit_emissive(positions[combatant_id] as Vector2, combatant, playback_seconds)
	_draw_ambient_particles(snapshot)
	_draw_action_effect(snapshot)


func _draw_unit_emissive(position: Vector2, combatant: Dictionary, playback_seconds: float) -> void:
	var side := str(combatant.get("side", "enemy"))
	var accent := _bridge_color(str(combatant.get("accentColor", "#63e6ff")), CYAN)
	var alive := bool(combatant.get("alive", true))
	if not alive:
		accent = accent.darkened(0.62)
	var bob := sin(playback_seconds * 2.0 + position.x * 0.009) * 2.5 if alive else 0.0
	var base := position + Vector2(0.0, bob)
	draw_circle(base + Vector2(0.0, -80.0), 12.0, accent)
	var facing := -1.0 if side == "party" else 1.0
	draw_line(base + Vector2(facing * 47.0, -88.0), base + Vector2(facing * 78.0, -22.0), accent, 2.5)
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


func _draw_foreground_occluders(_snapshot: Dictionary) -> void:
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
	_draw_half_resolution_bloom(snapshot)
	for edge_index in range(9):
		var alpha := 0.018 + float(edge_index) * 0.008
		var inset := float(edge_index) * 8.0
		draw_rect(Rect2(inset, inset, HALF_SIZE.x - inset * 2.0, HALF_SIZE.y - inset * 2.0), Color(0.0, 0.0, 0.03, alpha), false, 11.0)


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


func _draw_interface(snapshot: Dictionary) -> void:
	var state := snapshot.get("state", {}) as Dictionary
	var frame := snapshot.get("frame", {}) as Dictionary
	var action := snapshot.get("action", {}) as Dictionary
	var positions := snapshot.get("positions", {}) as Dictionary
	var frame_index := int(snapshot.get("frame_index", 0))
	var playback_seconds := float(snapshot.get("playback_seconds", 0.0))
	var duration_seconds := maxf(0.001, float(snapshot.get("duration_seconds", 1.0)))
	var bridge := snapshot.get("bridge", {}) as Dictionary
	var font := ThemeDB.fallback_font
	draw_rect(Rect2(0.0, 0.0, 1920.0, 64.0), Color(0.005, 0.009, 0.02, 0.86))
	draw_string(font, Vector2(34.0, 39.0), "GODOT PRESENTATION CLIENT", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 22, CYAN)
	draw_string(font, Vector2(390.0, 38.0), "TYPESCRIPT CORE AUTHORITY  •  BRIDGE V%d  •  FULL-SCENE 960x540 POST" % int(bridge.get("schemaVersion", 0)), HORIZONTAL_ALIGNMENT_LEFT, -1.0, 18, Color(0.7, 0.77, 0.83, 1.0))
	draw_string(font, Vector2(1540.0, 38.0), "%05.2f / %05.2f" % [playback_seconds, duration_seconds], HORIZONTAL_ALIGNMENT_RIGHT, 346.0, 18, Color.WHITE)

	var queue := state.get("turnQueue", []) as Array
	for index in range(mini(10, queue.size())):
		var entry := queue[index] as Dictionary
		var x := 34.0 + float(index) * 52.0
		var active := str(entry.get("actorId", "")) == str(state.get("activeActorId", ""))
		draw_circle(Vector2(x + 18.0, 98.0), 16.0, GOLD if active else Color(0.18, 0.24, 0.32, 0.92))
		draw_string(font, Vector2(x + 5.0, 104.0), str(index + 1), HORIZONTAL_ALIGNMENT_CENTER, 26.0, 13, Color("#07101d") if active else Color.WHITE)

	var action_label := "INITIAL SNAPSHOT"
	if not action.is_empty():
		var ability_value: Variant = action.get("abilityName")
		action_label = str(ability_value) if ability_value != null else str(action.get("type", "")).replace("_", " ").to_upper()
	var audio_value: Variant = action.get("audioCue")
	if audio_value != null:
		action_label += "  •  AUDIO %s" % str(audio_value).to_upper()
	draw_rect(Rect2(560.0, 82.0, 800.0, 50.0), Color(0.003, 0.008, 0.018, 0.74))
	draw_rect(Rect2(560.0, 130.0, 800.0 * playback_seconds / duration_seconds, 3.0), CYAN)
	draw_string(font, Vector2(580.0, 115.0), action_label, HORIZONTAL_ALIGNMENT_CENTER, 760.0, 19, GOLD)
	_draw_combatant_labels(state, positions, playback_seconds)
	_draw_damage_popups(snapshot, state, positions)

	if not bool(snapshot.get("show_overlay", true)):
		return
	var source := bridge.get("source", {}) as Dictionary
	var encounter := bridge.get("encounter", {}) as Dictionary
	var layer_visibility := snapshot.get("layer_visibility", []) as Array
	draw_rect(Rect2(30.0, 860.0, 760.0, 188.0), Color(0.004, 0.009, 0.02, 0.88))
	draw_rect(Rect2(30.0, 860.0, 5.0, 188.0), CYAN)
	draw_string(font, Vector2(54.0, 893.0), str(encounter.get("name", "")), HORIZONTAL_ALIGNMENT_LEFT, -1.0, 19, CYAN)
	draw_string(font, Vector2(54.0, 923.0), "Snapshot %d / %d  •  Core turn %d  •  %s" % [frame_index + 1, int(snapshot.get("frame_count", 0)), int(state.get("turnNumber", 0)), str(state.get("status", ""))], HORIZONTAL_ALIGNMENT_LEFT, -1.0, 17, Color.WHITE)
	draw_string(font, Vector2(54.0, 952.0), "Fixture %s  •  seed %d  •  frame %.2f ms" % [str(source.get("fixtureId", "")), int(source.get("seed", 0)), _average_frame_ms(snapshot)], HORIZONTAL_ALIGNMENT_LEFT, -1.0, 17, Color(0.78, 0.84, 0.89, 1.0))
	draw_string(font, Vector2(54.0, 981.0), "Layers %s  •  F1-F9 toggle  •  F10 restore  •  D diagnose" % _layer_mask(layer_visibility), HORIZONTAL_ALIGNMENT_LEFT, -1.0, 15, GOLD)
	draw_string(font, Vector2(54.0, 1010.0), "SPACE pause  •  R restart  •  TAB overlay  •  ESC quit", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 15, MUTED)
	draw_string(font, Vector2(54.0, 1038.0), "Snapshots and semantic cues only; no GDScript combat resolution.", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 15, Color(0.72, 0.8, 0.86, 1.0))


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
		var bob := sin(playback_seconds * 2.0 + position.x * 0.009) * 2.5 if alive else 0.0
		var base := position + Vector2(0.0, bob)
		var accent := _bridge_color(str(combatant.get("accentColor", "#63e6ff")), CYAN)
		if not alive:
			accent = accent.darkened(0.62)
		var hp := float(combatant.get("hp", 0.0))
		var max_hp := maxf(1.0, float(combatant.get("maxHp", 1.0)))
		draw_rect(Rect2(base.x - 56.0, base.y + 34.0, 112.0, 7.0), Color(0.0, 0.0, 0.0, 0.72))
		draw_rect(Rect2(base.x - 56.0, base.y + 34.0, 112.0 * hp / max_hp, 7.0), accent)
		draw_string(font, base + Vector2(-82.0, -177.0), str(combatant.get("displayName", combatant_id)), HORIZONTAL_ALIGNMENT_CENTER, 164.0, 15, Color.WHITE)
		var band_value: Variant = (combatant.get("range", {}) as Dictionary).get("band")
		if band_value != null:
			draw_string(font, base + Vector2(-58.0, 62.0), str(band_value).to_upper(), HORIZONTAL_ALIGNMENT_CENTER, 116.0, 13, Color(accent, 0.86))


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
		var event_target := (positions[target_id] as Vector2) + Vector2(0.0, -205.0 - popup_progress * 35.0)
		draw_string(ThemeDB.fallback_font, event_target, "-%d" % int(event.get("amount", 0)), HORIZONTAL_ALIGNMENT_CENTER, 100.0, 26, Color(GOLD, 1.0 - popup_progress))


func _environment(snapshot: Dictionary) -> Dictionary:
	var bridge := snapshot.get("bridge", {}) as Dictionary
	return (bridge.get("encounter", {}) as Dictionary).get("environment", {}) as Dictionary


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
