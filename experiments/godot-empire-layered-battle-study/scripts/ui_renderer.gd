extends Node2D

const DESIGN_SIZE := Vector2(1920.0, 1080.0)
const UI_WHITE := Color("#f8fafc")
const UI_MUTED := Color("#9aa8b8")
const UI_CYAN := Color("#67e8f9")
const UI_GOLD := Color("#f6c96b")
const UI_RED := Color("#fb7185")

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
	var choice := str(state.get("choice", "?"))
	var post_enabled := bool(state.get("post_enabled", false))
	var font := ThemeDB.fallback_font
	draw_rect(Rect2(0.0, 0.0, DESIGN_SIZE.x, 92.0), Color(0.002, 0.006, 0.014, 0.94))
	draw_line(Vector2(0.0, 92.0), Vector2(DESIGN_SIZE.x, 92.0), Color(UI_CYAN, 0.46), 2.0)
	draw_string(font, Vector2(28.0, 36.0), "IMPERIAL LAYERED BATTLE-STAGE STUDY", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 22, UI_WHITE)
	draw_string(font, Vector2(28.0, 67.0), "PROPOSED • UNSELECTED • ISOLATED REVIEW • NO RUNTIME MANIFEST", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_RED)
	var choice_rect := Rect2(1360.0, 16.0, 242.0, 60.0)
	draw_rect(choice_rect, Color(0.02, 0.03, 0.05, 0.92))
	draw_rect(choice_rect, UI_GOLD, false, 2.0)
	draw_string(font, Vector2(1380.0, 52.0), "MATCHED SET %s" % choice, HORIZONTAL_ALIGNMENT_LEFT, -1.0, 18, UI_GOLD)
	var post_rect := Rect2(1620.0, 16.0, 272.0, 60.0)
	draw_rect(post_rect, Color(0.02, 0.03, 0.05, 0.92))
	draw_rect(post_rect, UI_CYAN if post_enabled else UI_MUTED, false, 2.0)
	draw_string(font, Vector2(1640.0, 52.0), "POST %s" % ("ON" if post_enabled else "RAW BYPASS"), HORIZONTAL_ALIGNMENT_LEFT, -1.0, 16, UI_CYAN if post_enabled else UI_MUTED)
	draw_rect(Rect2(28.0, 116.0, 620.0, 94.0), Color(0.002, 0.006, 0.014, 0.78))
	draw_rect(Rect2(28.0, 116.0, 620.0, 94.0), Color(UI_GOLD, 0.42), false, 1.0)
	draw_string(font, Vector2(48.0, 148.0), str(state.get("label", "UNKNOWN CHOICE")), HORIZONTAL_ALIGNMENT_LEFT, 580.0, 14, UI_GOLD)
	draw_string(font, Vector2(48.0, 177.0), "Backdrop + floor + foreground switch together for comparison only.", HORIZONTAL_ALIGNMENT_LEFT, 580.0, 12, UI_WHITE)
	draw_string(font, Vector2(48.0, 200.0), "Each layer remains an independent developer decision.", HORIZONTAL_ALIGNMENT_LEFT, 580.0, 12, UI_MUTED)
	draw_rect(Rect2(1510.0, 116.0, 382.0, 104.0), Color(0.002, 0.006, 0.014, 0.84))
	draw_rect(Rect2(1510.0, 116.0, 382.0, 104.0), UI_WHITE, false, 2.0)
	draw_string(font, Vector2(1530.0, 151.0), "UI OUTSIDE POST", HORIZONTAL_ALIGNMENT_LEFT, 340.0, 16, UI_WHITE)
	draw_string(font, Vector2(1530.0, 180.0), "TRUE-WHITE / CYAN REFERENCE", HORIZONTAL_ALIGNMENT_LEFT, 340.0, 12, UI_CYAN)
	draw_string(font, Vector2(1530.0, 207.0), "CanvasLayer 100 sibling", HORIZONTAL_ALIGNMENT_LEFT, 340.0, 12, UI_MUTED)
	draw_rect(Rect2(0.0, 1008.0, DESIGN_SIZE.x, 72.0), Color(0.002, 0.006, 0.014, 0.95))
	draw_line(Vector2(0.0, 1008.0), Vector2(DESIGN_SIZE.x, 1008.0), Color(UI_CYAN, 0.40), 1.0)
	draw_string(font, Vector2(28.0, 1040.0), "TAB / 1 / 2  A↔B     P  RAW↔POST     ESC  QUIT", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_WHITE)
	draw_string(font, Vector2(28.0, 1067.0), "960×540 composed world → one post/upscale → 1920×1080 • procedural units/emissive are neutral stand-ins", HORIZONTAL_ALIGNMENT_LEFT, 1360.0, 12, UI_MUTED)
	draw_string(font, Vector2(1530.0, 1054.0), "NOT APPROVED", HORIZONTAL_ALIGNMENT_RIGHT, 350.0, 14, UI_RED)


func _snapshot() -> Dictionary:
	if controller == null or not controller.has_method("render_snapshot"):
		return {}
	var value: Variant = controller.call("render_snapshot")
	if value is Dictionary:
		return value as Dictionary
	return {}
