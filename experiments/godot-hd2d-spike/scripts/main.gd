extends Node2D

const DESIGN_SIZE := Vector2(1920.0, 1080.0)
const REPLAY_PATH := "res://data/static_replay.json"
const PARTY_COLOR := Color("#3a7d78")
const PARTY_ACCENT := Color("#53f2c3")
const ENEMY_COLOR := Color("#48556d")
const ENEMY_ACCENT := Color("#ff796f")
const CYAN := Color("#63e6ff")
const GOLD := Color("#ffcf67")
const GREEN := Color("#53f2a8")

var replay: Dictionary = {}
var events: Array = []
var playback_seconds := 0.0
var loop_duration := 24.0
var paused := false
var show_overlay := true
var ambient_particles: Array[Dictionary] = []
var foreground_dust: Array[Dictionary] = []
var last_event_label := "LOADING STATIC REPLAY"
var frame_samples: Array[float] = []

func _ready() -> void:
	_load_replay()
	_build_deterministic_particles()
	get_viewport().set_embedding_subwindows(false)
	print("[Godot HD-2D Spike] Loaded %d static events; no combat logic is executed." % events.size())
	queue_redraw()

func _process(delta: float) -> void:
	frame_samples.append(delta * 1000.0)
	if frame_samples.size() > 120:
		frame_samples.pop_front()
	if not paused:
		playback_seconds = fmod(playback_seconds + delta, loop_duration)
	queue_redraw()

func _unhandled_input(event: InputEvent) -> void:
	if not event is InputEventKey or not event.pressed:
		return
	if event.keycode == KEY_SPACE:
		paused = not paused
	elif event.keycode == KEY_R:
		playback_seconds = 0.0
	elif event.keycode == KEY_TAB:
		show_overlay = not show_overlay
	elif event.keycode == KEY_ESCAPE:
		get_tree().quit()

func _draw() -> void:
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
	_draw_background()
	_draw_light_shafts()
	_draw_stage()
	_draw_ambient_particles()
	var positions := _unit_positions()
	_draw_units(positions)
	_draw_active_effects(positions)
	_draw_foreground()
	_draw_interface()

func _load_replay() -> void:
	var file := FileAccess.open(REPLAY_PATH, FileAccess.READ)
	if file == null:
		push_error("Missing static replay fixture: %s" % REPLAY_PATH)
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		push_error("Static replay fixture must be a JSON object.")
		return
	replay = parsed as Dictionary
	events = replay.get("events", []) as Array
	loop_duration = float(replay.get("durationSeconds", 24.0))
	if events.is_empty():
		push_error("Static replay contains no presentation events.")

func _build_deterministic_particles() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = 0xD34D57A1
	for index in 48:
		ambient_particles.append({
			"x": rng.randf_range(80.0, 1840.0),
			"y": rng.randf_range(110.0, 830.0),
			"radius": rng.randf_range(1.0, 3.2),
			"phase": rng.randf_range(0.0, TAU),
			"speed": rng.randf_range(0.08, 0.24)
		})
	for index in 11:
		foreground_dust.append({
			"x": rng.randf_range(0.0, 1920.0),
			"y": rng.randf_range(720.0, 1060.0),
			"radius": rng.randf_range(6.0, 18.0),
			"phase": rng.randf_range(0.0, TAU)
		})

func _draw_background() -> void:
	for band in 36:
		var ratio := float(band) / 35.0
		var color := Color(0.012 + ratio * 0.025, 0.021 + ratio * 0.025, 0.05 + ratio * 0.045, 1.0)
		draw_rect(Rect2(0.0, ratio * 820.0, 1920.0, 26.0), color)

	var far_shift := sin(playback_seconds * 0.15) * 14.0
	for index in 9:
		var x := 80.0 + index * 236.0 + far_shift
		var height := 420.0 + float(index % 3) * 74.0
		draw_rect(Rect2(x, 180.0, 112.0, height), Color(0.045, 0.061, 0.105, 0.76))
		draw_rect(Rect2(x + 17.0, 205.0, 8.0, height - 45.0), Color(0.12, 0.18, 0.26, 0.28))

	for index in 5:
		var arch_x := 260.0 + index * 350.0 - far_shift * 0.4
		draw_arc(Vector2(arch_x, 570.0), 165.0, PI, TAU, 48, Color(0.08, 0.1, 0.16, 0.7), 42.0)

func _draw_light_shafts() -> void:
	var pulse := 0.84 + sin(playback_seconds * 0.55) * 0.05
	var shaft := PackedVector2Array([
		Vector2(1450.0, 0.0), Vector2(1740.0, 0.0), Vector2(1340.0, 850.0), Vector2(950.0, 850.0)
	])
	draw_polygon(shaft, PackedColorArray([Color(0.42, 0.2, 0.08, 0.13 * pulse)]))
	var cool_shaft := PackedVector2Array([
		Vector2(210.0, 0.0), Vector2(390.0, 0.0), Vector2(760.0, 840.0), Vector2(530.0, 840.0)
	])
	draw_polygon(cool_shaft, PackedColorArray([Color(0.08, 0.32, 0.42, 0.08)]))

func _draw_stage() -> void:
	draw_rect(Rect2(0.0, 770.0, 1920.0, 310.0), Color(0.022, 0.03, 0.047, 1.0))
	var vanishing := Vector2(960.0, 735.0)
	for index in 15:
		var bottom_x := float(index) * 150.0 - 90.0
		draw_line(vanishing, Vector2(bottom_x, 1080.0), Color(0.2, 0.31, 0.36, 0.18), 2.0)
	for row in 8:
		var ratio := float(row) / 7.0
		var y: float = lerpf(788.0, 1080.0, pow(ratio, 1.7))
		draw_line(Vector2(0.0, y), Vector2(1920.0, y), Color(0.2, 0.31, 0.36, 0.16), 2.0)
	draw_line(Vector2(0.0, 790.0), Vector2(1920.0, 790.0), Color(0.42, 0.65, 0.67, 0.26), 3.0)

func _draw_ambient_particles() -> void:
	for particle in ambient_particles:
		var drift := fmod(playback_seconds * float(particle["speed"]) * 90.0 + float(particle["phase"]) * 30.0, 900.0)
		var y := fmod(float(particle["y"]) - drift + 900.0, 900.0)
		var alpha := 0.16 + sin(playback_seconds * 1.3 + float(particle["phase"])) * 0.08
		draw_circle(Vector2(float(particle["x"]), y), float(particle["radius"]), Color(0.45, 0.84, 0.9, alpha))

func _unit_positions() -> Dictionary:
	var positions := {
		"enemy_power": Vector2(350.0, 770.0),
		"enemy_critical": Vector2(590.0, 790.0),
		"enemy_queue": Vector2(800.0, 770.0),
		"party_power": Vector2(1570.0, 770.0),
		"party_critical": Vector2(1330.0, 790.0),
		"party_queue": Vector2(1120.0, 770.0)
	}
	var advance := _event_progress("advance")
	positions["party_critical"] = Vector2(lerp(1330.0, 1160.0, _ease_in_out(advance)), 790.0)
	var engage := _event_progress("engage")
	if engage > 0.0:
		positions["party_critical"] = Vector2(lerp(1160.0, 990.0, _ease_in_out(engage)), 790.0)
		positions["enemy_critical"] = Vector2(lerp(590.0, 890.0, _ease_in_out(engage)), 790.0)
	if playback_seconds >= 8.2:
		positions["party_critical"] = Vector2(990.0, 790.0)
		positions["enemy_critical"] = Vector2(890.0, 790.0)
	var first_melee := _event_progress_at(9.0, 0.42)
	if first_melee > 0.0 and first_melee < 1.0:
		positions["party_critical"] += Vector2(-sin(first_melee * PI) * 62.0, -sin(first_melee * PI) * 10.0)
	var heavy := _event_progress_at(18.0, 0.55)
	if heavy > 0.0 and heavy < 1.0:
		positions["party_power"] += Vector2(-sin(heavy * PI) * 105.0, -sin(heavy * PI) * 12.0)
	return positions

func _draw_units(positions: Dictionary) -> void:
	_draw_unit(positions["enemy_power"], ENEMY_COLOR, ENEMY_ACCENT, 1.05, false, "A")
	_draw_unit(positions["enemy_critical"], ENEMY_COLOR.darkened(0.08), Color("#ffb36c"), 0.9, false, "B")
	_draw_unit(positions["enemy_queue"], ENEMY_COLOR.lightened(0.04), Color("#de7aff"), 1.0, false, "C")
	_draw_unit(positions["party_power"], PARTY_COLOR, PARTY_ACCENT, 1.08, true, "P")
	_draw_unit(positions["party_critical"], PARTY_COLOR.darkened(0.08), CYAN, 0.9, true, "C")
	_draw_unit(positions["party_queue"], PARTY_COLOR.lightened(0.04), GOLD, 1.0, true, "Q")

func _draw_unit(position: Vector2, body: Color, accent: Color, weight: float, faces_left: bool, letter: String) -> void:
	var facing := -1.0 if faces_left else 1.0
	var bob := sin(playback_seconds * 2.0 + position.x * 0.009) * 2.5
	var base := position + Vector2(0.0, bob)
	_draw_ellipse_shape(base + Vector2(0.0, 24.0), Vector2(72.0 * weight, 16.0), Color(0.0, 0.0, 0.0, 0.48))
	draw_rect(Rect2(base.x - 43.0 * weight, base.y - 132.0, 86.0 * weight, 132.0), body)
	draw_polygon(PackedVector2Array([
		base + Vector2(-54.0 * weight, -120.0),
		base + Vector2(0.0, -160.0),
		base + Vector2(54.0 * weight, -120.0),
		base + Vector2(36.0 * weight, -88.0),
		base + Vector2(-36.0 * weight, -88.0)
	]), PackedColorArray([body.lightened(0.1)]))
	draw_rect(Rect2(base.x - 28.0 * weight, base.y - 114.0, 56.0 * weight, 70.0), body.lightened(0.13))
	draw_circle(base + Vector2(0.0, -83.0), 13.0, accent)
	draw_circle(base + Vector2(0.0, -83.0), 5.0, Color(0.93, 1.0, 0.92, 0.9))
	draw_rect(Rect2(base.x - 56.0 * weight, base.y - 108.0, 16.0, 76.0), body.darkened(0.14))
	draw_rect(Rect2(base.x + 40.0 * weight, base.y - 108.0, 16.0, 76.0), body.darkened(0.14))
	draw_rect(Rect2(base.x - 34.0 * weight, base.y, 20.0, 18.0), body.darkened(0.24))
	draw_rect(Rect2(base.x + 14.0 * weight, base.y, 20.0, 18.0), body.darkened(0.24))
	draw_line(base + Vector2(facing * 48.0 * weight, -92.0), base + Vector2(facing * 82.0 * weight, -24.0), accent, 9.0)
	draw_string(ThemeDB.fallback_font, base + Vector2(-7.0, -178.0), letter, HORIZONTAL_ALIGNMENT_LEFT, -1.0, 18, accent)

func _draw_ellipse_shape(center: Vector2, radii: Vector2, color: Color) -> void:
	var points := PackedVector2Array()
	for index in 28:
		var angle := TAU * float(index) / 28.0
		points.append(center + Vector2(cos(angle) * radii.x, sin(angle) * radii.y))
	draw_polygon(points, PackedColorArray([color]))

func _draw_active_effects(positions: Dictionary) -> void:
	last_event_label = "OBSERVE DEPTH, READABILITY, AND IMPACT"
	for item in events:
		var event := item as Dictionary
		var at := float(event.get("at", -1.0))
		var duration := float(event.get("duration", 0.0))
		if playback_seconds >= at and playback_seconds <= at + duration:
			last_event_label = str(event.get("label", event.get("type", "EVENT")))

	_draw_disruptor_event(positions, "held_disruptor")
	_draw_disruptor_event(positions, "direct_disruptor")
	_draw_melee_contact(positions, 9.0, "party_critical", "enemy_critical", CYAN)
	_draw_melee_contact(positions, 18.0, "party_power", "enemy_power", GOLD)
	_draw_shield(positions["party_power"] as Vector2)

func _draw_disruptor_event(positions: Dictionary, event_type: String) -> void:
	var event := _find_event(event_type)
	if event.is_empty():
		return
	var at := float(event["at"])
	var elapsed := playback_seconds - at
	if elapsed < 0.0 or elapsed > float(event["duration"]):
		return
	var source := positions[str(event["actor"])] as Vector2
	var target := positions[str(event["target"])] as Vector2
	source += Vector2(0.0, -82.0)
	target += Vector2(0.0, -82.0)
	var charge_end := 0.22
	var contact_at := float(event.get("contactAfter", 0.46))
	if elapsed < charge_end:
		var charge := elapsed / charge_end
		for ring in 3:
			draw_arc(source, 18.0 + ring * 13.0 + charge * 14.0, 0.0, TAU, 40, Color(0.3, 1.0, 0.67, 0.34 - ring * 0.07), 4.0)
		draw_circle(source, 8.0 + charge * 9.0, Color(0.75, 1.0, 0.84, 0.78))
	elif elapsed < contact_at:
		var beam_progress: float = (elapsed - charge_end) / maxf(0.001, contact_at - charge_end)
		var beam_end: Vector2 = source.lerp(target, beam_progress)
		draw_line(source, beam_end, Color(0.18, 0.78, 0.5, 0.3), 22.0)
		draw_line(source, beam_end, Color(0.5, 1.0, 0.72, 0.9), 8.0)
		draw_line(source, beam_end, Color.WHITE, 2.0)
	else:
		var impact: float = clampf((elapsed - contact_at) / maxf(0.001, float(event["duration"]) - contact_at), 0.0, 1.0)
		for ring in 4:
			draw_arc(target, 24.0 + impact * (65.0 + ring * 16.0), 0.0, TAU, 48, Color(0.35, 1.0, 0.67, (1.0 - impact) * 0.55), 7.0 - ring)
		draw_circle(target, 32.0 * (1.0 - impact), Color(0.8, 1.0, 0.88, 0.6 * (1.0 - impact)))

func _draw_melee_contact(positions: Dictionary, at: float, actor_id: String, target_id: String, color: Color) -> void:
	var elapsed := playback_seconds - at
	if elapsed < 0.08 or elapsed > 0.34:
		return
	var progress: float = clampf((elapsed - 0.08) / 0.26, 0.0, 1.0)
	var target: Vector2 = (positions[target_id] as Vector2) + Vector2(0.0, -82.0)
	var alpha: float = 1.0 - progress
	draw_line(target + Vector2(-62.0, -74.0), target + Vector2(48.0, 60.0), Color(color, alpha), 10.0)
	draw_line(target + Vector2(-40.0, -78.0), target + Vector2(68.0, 42.0), Color.WHITE, 3.0)
	for spark in 9:
		var angle := float(spark) / 9.0 * TAU
		var length: float = 32.0 + progress * 68.0
		draw_line(target, target + Vector2(cos(angle), sin(angle)) * length, Color(color, alpha * 0.8), 3.0)

func _draw_shield(position: Vector2) -> void:
	var raised := playback_seconds >= 11.5 and playback_seconds < 15.1
	if not raised:
		return
	var age: float = clampf((playback_seconds - 11.5) / 0.3, 0.0, 1.0)
	var pulse := 1.0 + sin(playback_seconds * 7.0) * 0.035
	var center := position + Vector2(0.0, -72.0)
	for ring in 4:
		draw_arc(center, (80.0 + ring * 7.0) * pulse, 0.0, TAU, 72, Color(0.2, 0.75, 1.0, (0.32 - ring * 0.055) * age), 5.0)
	for segment in 6:
		var angle := float(segment) / 6.0 * TAU + playback_seconds * 0.08
		draw_line(center + Vector2(cos(angle), sin(angle)) * 66.0, center + Vector2(cos(angle), sin(angle)) * 92.0, Color(CYAN, 0.38 * age), 3.0)

func _draw_foreground() -> void:
	for particle in foreground_dust:
		var x := fmod(float(particle["x"]) + playback_seconds * 12.0 + 1920.0, 1920.0)
		var y := float(particle["y"]) + sin(playback_seconds * 0.4 + float(particle["phase"])) * 12.0
		draw_circle(Vector2(x, y), float(particle["radius"]), Color(0.05, 0.08, 0.1, 0.28))

func _draw_interface() -> void:
	var font := ThemeDB.fallback_font
	draw_rect(Rect2(0.0, 0.0, 1920.0, 64.0), Color(0.005, 0.009, 0.02, 0.84))
	draw_string(font, Vector2(34.0, 39.0), "GODOT HD-2D EVALUATION", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 22, CYAN)
	draw_string(font, Vector2(430.0, 38.0), "STATIC REPLAY • NO COMBAT LOGIC • COMPATIBILITY RENDERER", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 18, Color(0.7, 0.77, 0.83, 1.0))
	draw_string(font, Vector2(1838.0, 38.0), "%05.2f / %05.2f" % [playback_seconds, loop_duration], HORIZONTAL_ALIGNMENT_RIGHT, -1.0, 18, Color.WHITE)

	draw_rect(Rect2(560.0, 82.0, 800.0, 50.0), Color(0.003, 0.008, 0.018, 0.72))
	draw_rect(Rect2(560.0, 130.0, 800.0 * playback_seconds / loop_duration, 3.0), CYAN)
	draw_string(font, Vector2(960.0, 115.0), last_event_label, HORIZONTAL_ALIGNMENT_CENTER, 760.0, 20, GOLD)

	if not show_overlay:
		return
	var average_ms := 0.0
	for sample in frame_samples:
		average_ms += sample
	if not frame_samples.is_empty():
		average_ms /= frame_samples.size()
	draw_rect(Rect2(30.0, 858.0, 610.0, 190.0), Color(0.004, 0.009, 0.02, 0.86))
	draw_rect(Rect2(30.0, 858.0, 5.0, 190.0), CYAN)
	draw_string(font, Vector2(54.0, 892.0), "EVALUATION TELEMETRY", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 19, CYAN)
	draw_string(font, Vector2(54.0, 922.0), "Frame average: %.2f ms  |  target ≤16.67 ms" % average_ms, HORIZONTAL_ALIGNMENT_LEFT, -1.0, 17, Color.WHITE)
	draw_string(font, Vector2(54.0, 951.0), "Replay: %d events from JSON  |  loop hash fixture: D34D57A1" % events.size(), HORIZONTAL_ALIGNMENT_LEFT, -1.0, 17, Color(0.78, 0.84, 0.89, 1.0))
	draw_string(font, Vector2(54.0, 980.0), "SPACE pause  •  R restart  •  TAB overlay  •  ESC quit", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 17, Color(0.78, 0.84, 0.89, 1.0))
	draw_string(font, Vector2(54.0, 1018.0), "Exploratory: depth / readability / impact — developer approval pending", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 16, GOLD)

	draw_rect(Rect2(1310.0, 850.0, 580.0, 198.0), Color(0.004, 0.009, 0.02, 0.86))
	draw_rect(Rect2(1885.0, 850.0, 5.0, 198.0), GREEN)
	draw_string(font, Vector2(1335.0, 884.0), "A/B REVIEW GATES", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 19, GREEN)
	draw_string(font, Vector2(1335.0, 916.0), "□ Depth and focal hierarchy ≥ 4/5", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 17, Color.WHITE)
	draw_string(font, Vector2(1335.0, 945.0), "□ Combat readability ≥ 4/5", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 17, Color.WHITE)
	draw_string(font, Vector2(1335.0, 974.0), "□ Contact impact ≥ 4/5", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 17, Color.WHITE)
	draw_string(font, Vector2(1335.0, 1003.0), "□ Web / audio / workflow hard gates pending", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 17, GOLD)

func _event_progress(event_type: String) -> float:
	var event := _find_event(event_type)
	if event.is_empty():
		return 0.0
	return _event_progress_at(float(event["at"]), float(event["duration"]))

func _event_progress_at(at: float, duration: float) -> float:
	if playback_seconds < at:
		return 0.0
	return clampf((playback_seconds - at) / maxf(0.001, duration), 0.0, 1.0)

func _find_event(event_type: String) -> Dictionary:
	for item in events:
		var event := item as Dictionary
		if str(event.get("type", "")) == event_type:
			return event
	return {}

func _ease_in_out(value: float) -> float:
	return value * value * (3.0 - 2.0 * value)
