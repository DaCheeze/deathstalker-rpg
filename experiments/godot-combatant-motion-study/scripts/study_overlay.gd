extends Node2D

const DESIGN_SIZE: Vector2 = Vector2(1920.0, 1080.0)
const UI_WHITE: Color = Color("#f8fafc")
const UI_MUTED: Color = Color("#a7b3c4")
const UI_CYAN: Color = Color("#63e6ff")
const UI_GOLD: Color = Color("#ffcf67")
const UI_RED: Color = Color("#fb7185")
const UI_GREEN: Color = Color("#6ee7b7")

var snapshot: Dictionary = {}


func configure(next_snapshot: Dictionary) -> void:
	snapshot = next_snapshot.duplicate(true)
	queue_redraw()


func _draw() -> void:
	if snapshot.is_empty():
		return
	_draw_header()
	_draw_pipeline_labels()
	_draw_anchor_monitor()
	_draw_footer_timeline()


func _draw_header() -> void:
	var font: Font = ThemeDB.fallback_font
	draw_rect(Rect2(0.0, 0.0, DESIGN_SIZE.x, 100.0), Color(0.003, 0.008, 0.020, 0.97))
	draw_line(Vector2(0.0, 100.0), Vector2(DESIGN_SIZE.x, 100.0), Color(UI_CYAN, 0.48), 2.0)
	draw_string(font, Vector2(24.0, 34.0), "POWER MELEE MOTION-PIPELINE ENGINEERING STUDY", HORIZONTAL_ALIGNMENT_LEFT, 760.0, 22, UI_WHITE)
	draw_string(font, Vector2(24.0, 63.0), "UNAPPROVED • ONE IDLE PNG • DERIVED PRESENTATION ONLY • NO ANIMATION COVERAGE OR COMBAT OUTCOMES", HORIZONTAL_ALIGNMENT_LEFT, 1120.0, 13, UI_RED)
	draw_string(font, Vector2(24.0, 86.0), "%s • %s" % [str(snapshot.get("asset_label", "UNKNOWN CHOICE")), str(snapshot.get("view_label", "UNKNOWN VIEW"))], HORIZONTAL_ALIGNMENT_LEFT, 1120.0, 12, UI_CYAN)
	var state_id: String = str(snapshot.get("state_id", "idle")).to_upper()
	var state_elapsed: int = int(snapshot.get("state_elapsed_ms", 0))
	var state_duration: int = int(snapshot.get("state_duration_ms", 1))
	var state_color: Color = UI_RED if state_id == "CONTACT" else UI_GOLD
	draw_rect(Rect2(1240.0, 14.0, 650.0, 72.0), Color(0.02, 0.03, 0.05, 0.90))
	draw_rect(Rect2(1240.0, 14.0, 650.0, 72.0), Color(state_color, 0.78), false, 2.0)
	draw_string(font, Vector2(1260.0, 42.0), "STATE %s • %d / %d ms" % [state_id, state_elapsed, state_duration], HORIZONTAL_ALIGNMENT_LEFT, 360.0, 15, state_color)
	var playback_label: String = "PLAY" if bool(snapshot.get("playing", false)) else "PAUSED / FIXED"
	draw_string(font, Vector2(1630.0, 42.0), "%s • %.2fx" % [playback_label, float(snapshot.get("speed", 1.0))], HORIZONTAL_ALIGNMENT_RIGHT, 240.0, 13, UI_WHITE)
	draw_string(font, Vector2(1260.0, 69.0), "Loop %d / %d ms • contact window is exactly 100 ms" % [int(snapshot.get("timeline_ms", 0)), int(snapshot.get("loop_duration_ms", 0))], HORIZONTAL_ALIGNMENT_LEFT, 600.0, 12, UI_MUTED)


func _draw_pipeline_labels() -> void:
	var font: Font = ThemeDB.fallback_font
	var show_a: bool = bool(snapshot.get("show_a", true))
	var show_b: bool = bool(snapshot.get("show_b", true))
	_draw_label_panel(Rect2(52.0, 116.0, 824.0, 70.0), UI_GOLD if show_a else UI_MUTED)
	draw_string(font, Vector2(72.0, 144.0), "PIPELINE A • WHOLE-RASTER TRANSFORM", HORIZONTAL_ALIGNMENT_LEFT, 520.0, 16, UI_WHITE)
	draw_string(font, Vector2(72.0, 170.0), "translation + anchor-pivot rotation/scale + whole-sprite modulation", HORIZONTAL_ALIGNMENT_LEFT, 760.0, 12, UI_GOLD if show_a else UI_MUTED)
	_draw_label_panel(Rect2(1044.0, 116.0, 824.0, 70.0), UI_CYAN if show_b else UI_MUTED)
	draw_string(font, Vector2(1064.0, 144.0), "PIPELINE B • DELIBERATE HYBRID", HORIZONTAL_ALIGNMENT_LEFT, 520.0, 16, UI_WHITE)
	draw_string(font, Vector2(1064.0, 170.0), "anchor-locked shader deform + procedural trail/emissive/contact layers", HORIZONTAL_ALIGNMENT_LEFT, 760.0, 12, UI_CYAN if show_b else UI_MUTED)
	draw_line(Vector2(960.0, 100.0), Vector2(960.0, 915.0), Color(UI_MUTED, 0.34), 2.0)


func _draw_anchor_monitor() -> void:
	if not bool(snapshot.get("show_overlays", true)):
		return
	var show_a: bool = bool(snapshot.get("show_a", true))
	var show_b: bool = bool(snapshot.get("show_b", true))
	if show_a:
		_draw_one_anchor_monitor(
			snapshot.get("base_ground_a", Vector2.ZERO) as Vector2,
			snapshot.get("anchor_a", Vector2.ZERO) as Vector2,
			snapshot.get("bounds_a", PackedVector2Array()) as PackedVector2Array,
			UI_GOLD,
			"A anchor-pivot"
		)
	if show_b:
		_draw_one_anchor_monitor(
			snapshot.get("base_ground_b", Vector2.ZERO) as Vector2,
			snapshot.get("anchor_b", Vector2.ZERO) as Vector2,
			snapshot.get("bounds_b", PackedVector2Array()) as PackedVector2Array,
			UI_CYAN,
			"B shader anchor lock"
		)


func _draw_one_anchor_monitor(base_ground: Vector2, actual_anchor: Vector2, bounds: PackedVector2Array, accent: Color, label: String) -> void:
	var font: Font = ThemeDB.fallback_font
	draw_line(base_ground + Vector2(0.0, 14.0), base_ground + Vector2(-60.0, 14.0), Color(UI_GREEN, 0.58), 3.0, true)
	draw_circle(base_ground, 7.0, Color(UI_MUTED, 0.25))
	draw_arc(base_ground, 8.0, 0.0, TAU, 20, UI_MUTED, 2.0, true)
	draw_line(actual_anchor + Vector2(-16.0, 0.0), actual_anchor + Vector2(16.0, 0.0), UI_GREEN, 3.0, true)
	draw_line(actual_anchor + Vector2(0.0, -16.0), actual_anchor + Vector2(0.0, 16.0), UI_GREEN, 3.0, true)
	draw_circle(actual_anchor, 5.0, accent)
	if bounds.size() >= 4:
		var closed: PackedVector2Array = bounds.duplicate()
		closed.append(bounds[0])
		draw_polyline(closed, Color(accent, 0.88), 2.0, true)
	var delta: Vector2 = actual_anchor - base_ground
	draw_rect(Rect2(actual_anchor + Vector2(-112.0, 26.0), Vector2(224.0, 42.0)), Color(0.003, 0.008, 0.020, 0.86))
	draw_string(font, actual_anchor + Vector2(-102.0, 52.0), "%s  Δ(%.1f, %.1f)" % [label, delta.x, delta.y], HORIZONTAL_ALIGNMENT_CENTER, 204.0, 11, accent)


func _draw_footer_timeline() -> void:
	var font: Font = ThemeDB.fallback_font
	draw_rect(Rect2(0.0, 915.0, DESIGN_SIZE.x, 165.0), Color(0.003, 0.008, 0.020, 0.97))
	draw_line(Vector2(0.0, 915.0), Vector2(DESIGN_SIZE.x, 915.0), Color(UI_CYAN, 0.42), 2.0)
	var states_value: Variant = snapshot.get("states", [])
	var states: Array = states_value as Array if states_value is Array else []
	var loop_duration: float = maxf(1.0, float(snapshot.get("loop_duration_ms", 1)))
	var bar_rect: Rect2 = Rect2(36.0, 938.0, 1848.0, 38.0)
	draw_rect(bar_rect, Color("#111827"))
	for state_index: int in range(states.size()):
		if not (states[state_index] is Dictionary):
			continue
		var state: Dictionary = states[state_index] as Dictionary
		var segment_x: float = bar_rect.position.x + float(state.get("startMs", 0)) / loop_duration * bar_rect.size.x
		var segment_width: float = float(state.get("durationMs", 0)) / loop_duration * bar_rect.size.x
		var segment: Rect2 = Rect2(segment_x, bar_rect.position.y, segment_width, bar_rect.size.y)
		var active: bool = state_index == int(snapshot.get("state_index", 0))
		var color: Color = UI_RED if str(state.get("id", "")) == "contact" else (UI_GOLD if active else Color(UI_MUTED, 0.34))
		draw_rect(segment, Color(color, 0.36 if active else 0.14))
		draw_rect(segment, Color(color, 0.72), false, 1.0)
		draw_string(font, segment.position + Vector2(6.0, 25.0), str(state.get("id", "state")).to_upper(), HORIZONTAL_ALIGNMENT_CENTER, maxf(1.0, segment.size.x - 12.0), 10, UI_WHITE if active else UI_MUTED)
	var marker_x: float = bar_rect.position.x + float(snapshot.get("timeline_ms", 0)) / loop_duration * bar_rect.size.x
	draw_line(Vector2(marker_x, bar_rect.position.y - 7.0), Vector2(marker_x, bar_rect.end.y + 7.0), UI_GREEN, 3.0, true)
	draw_string(font, Vector2(36.0, 1008.0), "Space play/pause • ←/→ step 25 ms • PgUp/PgDn state • S 0.25x/1x • R reset • C choice • V view • P both/A/B • O overlays", HORIZONTAL_ALIGNMENT_LEFT, 1848.0, 12, UI_MUTED)
	draw_string(font, Vector2(36.0, 1038.0), "ANCHOR MONITOR: green cross is the current intended ground point; outline is the transformed alpha>=2 source bound.", HORIZONTAL_ALIGNMENT_LEFT, 1180.0, 12, UI_GREEN)
	draw_string(font, Vector2(36.0, 1064.0), "HYBRID EFFECT POSITIONS ARE BOUNDS-DERIVED REVIEW PROXIES — NOT SOCKETS • UI IS OUTSIDE ALL SPRITE MATERIALS", HORIZONTAL_ALIGNMENT_LEFT, 1420.0, 11, UI_CYAN)
	draw_string(font, Vector2(1470.0, 1038.0), "STRUCTURE + TIMELINE + ANCHOR: PASS", HORIZONTAL_ALIGNMENT_RIGHT, 414.0, 12, UI_GREEN)
	draw_string(font, Vector2(1470.0, 1064.0), "ENGINEERING STUDY • NOT APPROVED", HORIZONTAL_ALIGNMENT_RIGHT, 414.0, 12, UI_RED)


func _draw_label_panel(rect: Rect2, accent: Color) -> void:
	draw_rect(rect, Color(0.003, 0.008, 0.020, 0.88))
	draw_rect(Rect2(rect.position, Vector2(4.0, rect.size.y)), accent)
	draw_rect(rect, Color(accent, 0.42), false, 1.0)
