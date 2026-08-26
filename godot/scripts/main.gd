extends Node2D

const BridgeLoader = preload("res://scripts/presentation_bridge_loader.gd")
const CombatAudio = preload("res://scripts/procedural_combat_audio.gd")
const LicensedCueBank = preload("res://scripts/audio/licensed_cue_bank.gd")
const WebCoreClient = preload("res://scripts/web_game_core_client.gd")
const OpeningTranscriptClient = preload("res://scripts/opening_transcript_client.gd")
const LiveController = preload("res://scripts/live_session_controller.gd")
const OpeningController = preload("res://scripts/opening_expedition_controller.gd")
const WorldLoopController = preload("res://scripts/world_loop_controller.gd")
const RuntimeVisualAssets = preload("res://scripts/runtime_visual_assets.gd")
const DESIGN_SIZE := Vector2(1920.0, 1080.0)
const DEFAULT_FIXTURE_NAME := "legacy"
const DEFAULT_AUDIO_MODE := "auto"
const LICENSED_AUDIO_MANIFEST_PATH := "res://data/licensed-combat-audio-manifest-v1.json"
const LICENSED_AUDIO_ROOT := "res://assets/audio/licensed"
const AUDIO_MODES: Array[String] = ["auto", "procedural", "licensed"]
const FIXTURE_PATHS := {
	"legacy": "res://data/presentation-replay-v1.json",
	"range-band": "res://data/presentation-range-band-replay-v1.json",
}
const HALF_POST_SIZE := Vector2i(960, 540)
const LIVE_SESSION_SEED := 230825
const LIVE_SESSION_ID := "godot-web-opening-expedition"
const WORLD_LOOP_SESSION_ID := "godot-web-world-loop-proving-fixture"
const OPENING_TRANSCRIPT_PATH := "res://data/opening-expedition-transcript-v1.json"
const LIVE_FRAME_STEP_SECONDS := 0.75
const LIVE_END_HOLD_SECONDS := 1.0
const LIVE_RECOVERY_SECONDS := 0.18
const LIVE_ACTION_MENU_SIZE := Vector2(400.0, 46.0)
const LIVE_ACTION_MENU_GAP := 3.0
const LIVE_ACTION_MENU_ACTOR_GAP := 80.0
const LIVE_ACTION_MENU_VERTICAL_LIFT := 290.0
const LIVE_ACTION_MENU_MARGIN := 30.0
const OPENING_TRAVERSAL_OBJECTIVE_KEY := "opening.familiar_virimonde"
const DEATH_ORDER_OBJECTIVE_KEY := "opening.death_order"
const OPENING_TRAVERSAL_START := Vector2(360.0, 930.0)
const OPENING_TRAVERSAL_END := Vector2(1010.0, 825.0)
const OPENING_TRAVERSAL_SPEED := 0.34
const WORLD_LOOP_MOVE_SPEED := 360.0
const WORLD_LOOP_INTERACTION_RANGE := 105.0
const WORLD_LOOP_STAGE_MIN_X := 245.0
const WORLD_LOOP_STAGE_MAX_X := 1675.0
const PARTY_FORMATION: Array[Vector2] = [
	Vector2(1608.0, 910.0),
	Vector2(1430.0, 865.0),
	Vector2(1252.0, 820.0),
]
const ENEMY_FORMATION: Array[Vector2] = [
	Vector2(500.0, 880.0),
	Vector2(610.0, 900.0),
	Vector2(720.0, 870.0),
]
const POST_SHADER_PATH := "res://shaders/canonical_full_scene_post.gdshader"
const EXPECTED_LAYER_NAMES: Array[String] = [
	"Layer01Starfield",
	"Layer02FarBackdrop",
	"Layer03StageFloor",
	"Layer04EnemyUnits",
	"Layer05PartyUnits",
	"Layer06EmissivePass",
	"Layer07ForegroundOccluders",
	"Layer08BloomGradeVignetteComposite",
	"Layer09UI",
]
const EXPECTED_LAYER_GROUPS: Array[String] = [
	"compositor_layer_01_starfield",
	"compositor_layer_02_far_backdrop",
	"compositor_layer_03_stage_floor",
	"compositor_layer_04_enemy_units",
	"compositor_layer_05_party_units",
	"compositor_layer_06_emissive_pass",
	"compositor_layer_07_foreground_occluders",
	"compositor_layer_08_half_resolution_post",
	"compositor_layer_09_ui",
]

@onready var world_source_viewport: SubViewport = $WorldSourceViewport
@onready var world_design_surface: Node2D = $WorldSourceViewport/WorldDesignSurface
@onready var world_composition: Node2D = $WorldSourceViewport/WorldDesignSurface/WorldComposition
@onready var world_layers: Array[Node2D] = [
	$WorldSourceViewport/WorldDesignSurface/WorldComposition/Layer01Starfield,
	$WorldSourceViewport/WorldDesignSurface/WorldComposition/Layer02FarBackdrop,
	$WorldSourceViewport/WorldDesignSurface/WorldComposition/Layer03StageFloor,
	$WorldSourceViewport/WorldDesignSurface/WorldComposition/Layer04EnemyUnits,
	$WorldSourceViewport/WorldDesignSurface/WorldComposition/Layer05PartyUnits,
	$WorldSourceViewport/WorldDesignSurface/WorldComposition/Layer06EmissivePass,
	$WorldSourceViewport/WorldDesignSurface/WorldComposition/Layer07ForegroundOccluders,
	$Layer08BloomGradeVignetteComposite,
]
@onready var post_composite: Node2D = $Layer08BloomGradeVignetteComposite
@onready var ui_layer: CanvasLayer = $Layer09UI
@onready var ui_renderer: Node2D = $Layer09UI/UIRenderer
@onready var diagnostic_overlay: Node2D = $Layer09UI/DiagnosticOverlay

var bridge: Dictionary = {}
var frames: Array = []
var fixture_name := DEFAULT_FIXTURE_NAME
var fixture_path := ""
var requested_audio_mode := DEFAULT_AUDIO_MODE
var playback_seconds := 0.0
var duration_seconds := 1.0
var paused := false
var show_overlay := true
var smoke_mode := false
var playback_rate := 1.0
var ambient_particles: Array[Dictionary] = []
var frame_samples: Array[float] = []
var combat_audio: CombatAudio
var runtime_visual_assets: RefCounted
var runtime_environment_textures: Dictionary = {}
var audio_action_frame_ledger := {}
var audio_event_frame_ledger := {}
var logged_unsupported_audio_cues := {}
var audio_action_frames_seen := 0
var audio_null_action_cues := 0
var audio_action_cue_dispatches := 0
var audio_event_cue_dispatches := 0
var audio_supported_dispatches := 0
var audio_silent_dispatches := 0
var audio_render_ready_dispatches := 0
var audio_render_failures := 0
var audio_licensed_dispatches := 0
var audio_procedural_dispatches := 0
var layer_visibility: Array[bool] = [true, true, true, true, true, true, true, true, true]
var diagnostic_compositor := false
var live_mode := false
var opening_mode := false
var world_loop_mode := false
var opening_review_mode := false
var opening_capture_beat := -1
var opening_capture_path := ""
var opening_capture_route_end := false
var opening_capture_supplies_inspected := false
var live_client: Variant = null
var live_controller: RefCounted
var live_view: Dictionary = {}
var live_current_state: Dictionary = {}
var live_legal_actions: Array = []
var live_awaiting := ""
var live_status := ""
var live_error := ""
var live_transition_playing := false
var live_transition_complete_at := 0.0
var live_selected_action := 0
var opening_beat: Dictionary = {}
var opening_party: Array = []
var opening_inventory: Dictionary = {}
var opening_traversal_progress := 0.0
var opening_traversal_target := -1.0
var opening_supplies_inspected := false
var world_loop_location: Dictionary = {}
var world_loop_interactables: Array = []
var world_loop_campaign: Dictionary = {}
var world_loop_party: Array = []
var world_loop_player_position := Vector2(960.0, 910.0)
var world_loop_move_target_x := -1.0


func _ready() -> void:
	if (
		not _select_fixture_from_user_args()
		or not _select_audio_mode_from_user_args()
		or not _select_opening_review_from_user_args()
	):
		set_process(false)
		get_tree().quit(1)
		return
	if not _configure_runtime_visual_assets():
		set_process(false)
		get_tree().quit(1)
		return
	if not _validate_compositor_contract():
		set_process(false)
		get_tree().quit(1)
		return
	var user_arguments := OS.get_cmdline_user_args()
	smoke_mode = user_arguments.has("--bridge-smoke")
	diagnostic_compositor = user_arguments.has("--diagnostic")
	live_mode = (
		(OS.has_feature("web") or opening_review_mode)
		and not smoke_mode
		and not user_arguments.has("--replay")
	)
	world_loop_mode = live_mode and user_arguments.has("--world-loop")
	opening_mode = live_mode
	show_overlay = not live_mode
	if live_mode:
		if not _configure_live_session():
			set_process(false)
			get_tree().quit(1)
			return
	else:
		var loader := BridgeLoader.new()
		bridge = loader.load_and_validate(fixture_path)
		if bridge.is_empty():
			set_process(false)
			get_tree().quit(1)
			return
		frames = bridge.get("frames", []) as Array
		var timing := bridge.get("timing", {}) as Dictionary
		duration_seconds = float(timing.get("durationSeconds", 1.0))
		if not _validate_contact_gated_reveal():
			set_process(false)
			get_tree().quit(1)
			return
	playback_rate = 16.0 if smoke_mode else 1.0
	if not _configure_combat_audio():
		set_process(false)
		get_tree().quit(1)
		return
	_reset_audio_cycle()
	_update_audio_schedule()
	_build_deterministic_particles()
	_bind_compositor_renderers()
	_apply_diagnostic_layout()
	get_viewport().set_embedding_subwindows(false)
	if live_mode:
		print(
			"[Godot Live Session] Connected sequence=%d awaiting=%s legal_actions=%d; TypeScript remains authoritative."
			% [int(live_controller.get("sequence")), live_awaiting, live_legal_actions.size()]
		)
	else:
		print(
			"[Godot Presentation] Loaded fixture=%s with %d validated TypeScript snapshots (schema v%d); result state is contact-gated and no combat logic is executed."
			% [fixture_name, frames.size(), int(bridge.get("schemaVersion", 0))]
		)
	_refresh_all_compositor_layers()
	if opening_review_mode and opening_capture_beat >= 0:
		call_deferred("_run_opening_capture")


func _configure_runtime_visual_assets() -> bool:
	runtime_visual_assets = RuntimeVisualAssets.new()
	var verify_source_hashes := not OS.has_feature("web")
	if not bool(runtime_visual_assets.call("load_and_validate", verify_source_hashes)):
		var errors: Array = runtime_visual_assets.call("errors_copy")
		for message_value: Variant in errors:
			push_error(str(message_value))
		return false
	for layer_id: String in ["far_backdrop", "stage_floor", "foreground_occluder"]:
		var texture_value: Variant = runtime_visual_assets.call("texture_for", layer_id)
		if not texture_value is Texture2D:
			push_error("Runtime visual selection is missing texture %s." % layer_id)
			return false
		runtime_environment_textures[layer_id] = texture_value as Texture2D
	print(
		"[Runtime Visual Assets] Loaded developer-selected %s with %d authored compositor layers."
		% [str(runtime_visual_assets.call("selection_id")), runtime_environment_textures.size()]
	)
	return true


func _select_fixture_from_user_args() -> bool:
	var fixture_argument_seen := false
	var requested_fixture := DEFAULT_FIXTURE_NAME
	for argument in OS.get_cmdline_user_args():
		if not argument.begins_with("--fixture="):
			continue
		if fixture_argument_seen:
			push_error("Fixture selector may be provided only once.")
			return false
		fixture_argument_seen = true
		requested_fixture = argument.trim_prefix("--fixture=")

	if not FIXTURE_PATHS.has(requested_fixture):
		push_error(
			"Unknown fixture '%s'; expected --fixture=legacy or --fixture=range-band."
			% requested_fixture
		)
		return false
	fixture_name = requested_fixture
	fixture_path = str(FIXTURE_PATHS[requested_fixture])
	return true


func _select_audio_mode_from_user_args() -> bool:
	var audio_argument_seen := false
	var selected_mode := DEFAULT_AUDIO_MODE
	for argument in OS.get_cmdline_user_args():
		if not argument.begins_with("--audio="):
			continue
		if audio_argument_seen:
			push_error("Audio selector may be provided only once.")
			return false
		audio_argument_seen = true
		selected_mode = argument.trim_prefix("--audio=")
	if not AUDIO_MODES.has(selected_mode):
		push_error(
			"Unknown audio mode '%s'; expected --audio=auto, --audio=procedural, or --audio=licensed."
			% selected_mode
		)
		return false
	requested_audio_mode = selected_mode
	return true


func _select_opening_review_from_user_args() -> bool:
	var capture_beat_seen := false
	var capture_path_seen := false
	for argument in OS.get_cmdline_user_args():
		if argument == "--opening-review":
			opening_review_mode = true
		elif argument == "--opening-capture-route-end":
			opening_capture_route_end = true
		elif argument == "--opening-capture-supplies-inspected":
			opening_capture_supplies_inspected = true
		elif argument.begins_with("--opening-capture-beat="):
			if capture_beat_seen:
				push_error("Opening capture beat may be provided only once.")
				return false
			capture_beat_seen = true
			var beat_text := argument.trim_prefix("--opening-capture-beat=")
			if not beat_text.is_valid_int():
				push_error("Opening capture beat must be an integer from 0 through 9.")
				return false
			opening_capture_beat = int(beat_text)
		elif argument.begins_with("--opening-capture-path="):
			if capture_path_seen:
				push_error("Opening capture path may be provided only once.")
				return false
			capture_path_seen = true
			opening_capture_path = argument.trim_prefix("--opening-capture-path=")
	if opening_capture_beat < -1 or opening_capture_beat > 9:
		push_error("Opening capture beat must be an integer from 0 through 9.")
		return false
	if (
		capture_beat_seen
		or capture_path_seen
		or opening_capture_route_end
		or opening_capture_supplies_inspected
	) and not opening_review_mode:
		push_error("Opening capture options require --opening-review.")
		return false
	if capture_path_seen and opening_capture_path.strip_edges().is_empty():
		push_error("Opening capture path must not be empty.")
		return false
	if opening_capture_beat >= 0 and opening_capture_path.is_empty():
		opening_capture_path = "user://opening-expedition-beat-%02d.png" % opening_capture_beat
	if opening_capture_route_end and opening_capture_beat not in [0, 1]:
		push_error("--opening-capture-route-end requires --opening-capture-beat=0 or 1.")
		return false
	if opening_capture_supplies_inspected and not opening_capture_route_end:
		push_error("--opening-capture-supplies-inspected requires --opening-capture-route-end.")
		return false
	if opening_capture_supplies_inspected and opening_capture_beat != 0:
		push_error("--opening-capture-supplies-inspected requires --opening-capture-beat=0.")
		return false
	return true


func _configure_live_session() -> bool:
	if world_loop_mode:
		live_client = WebCoreClient.new()
		if not bool(live_client.call("connect_host")):
			push_error("Godot world-loop host connection failed: %s" % str(live_client.get("last_error")))
			return false
		live_controller = WorldLoopController.new()
		if not bool(live_controller.call("configure", live_client, WORLD_LOOP_SESSION_ID, LIVE_SESSION_SEED)):
			push_error("Godot world-loop setup failed: %s" % str(live_controller.get("last_error")))
			return false
		var world_response := live_controller.call("create_world_loop") as Dictionary
		if world_response.is_empty() or not bool(world_response.get("ok", false)):
			push_error("Godot world-loop creation failed: %s" % str(live_controller.get("last_error")))
			return false
		return _accept_live_response(world_response, true)
	if opening_review_mode:
		live_client = OpeningTranscriptClient.new()
		if not bool(live_client.call("configure", OPENING_TRANSCRIPT_PATH)):
			push_error("Godot opening transcript setup failed: %s" % str(live_client.get("last_error")))
			return false
	else:
		live_client = WebCoreClient.new()
		if not bool(live_client.call("connect_host")):
			push_error("Godot opening host connection failed: %s" % str(live_client.get("last_error")))
			return false
	live_controller = OpeningController.new()
	if not bool(live_controller.call("configure", live_client, LIVE_SESSION_ID, LIVE_SESSION_SEED)):
		push_error("Godot opening setup failed: %s" % str(live_controller.get("last_error")))
		return false
	var response: Dictionary = {}
	if not opening_review_mode:
		response = live_controller.call("resume_expedition") as Dictionary
		if not response.is_empty() and not bool(response.get("ok", false)):
			var resume_error := response.get("error", {}) as Dictionary
			if str(resume_error.get("code", "")) != "checkpoint_not_found":
				push_error("Godot opening resume failed: %s" % str(live_controller.get("last_error")))
				return false
			response = {}
	if response.is_empty():
		response = live_controller.call("create_expedition") as Dictionary
		if response.is_empty() or not bool(response.get("ok", false)):
			push_error("Godot opening creation failed: %s" % str(live_controller.get("last_error")))
			return false
	return _accept_live_response(response, true)


func _run_opening_capture() -> void:
	while int(live_view.get("beatIndex", -1)) < opening_capture_beat:
		if live_transition_playing:
			playback_seconds = live_transition_complete_at
			live_transition_playing = false
		if live_awaiting != "continue":
			if not _replay_next_opening_capture_command():
				get_tree().quit(1)
				return
			continue
		if _opening_traversal_active():
			opening_traversal_progress = _opening_traversal_destination_progress()
			opening_traversal_target = -1.0
		_advance_opening()
		if not live_error.is_empty():
			get_tree().quit(1)
			return
	if int(live_view.get("beatIndex", -1)) != opening_capture_beat:
		push_error("Opening capture did not reach requested beat %d." % opening_capture_beat)
		get_tree().quit(1)
		return
	if opening_capture_route_end and _opening_traversal_active():
		opening_traversal_progress = _opening_traversal_destination_progress()
		opening_traversal_target = -1.0
		opening_supplies_inspected = opening_capture_supplies_inspected
	_refresh_all_compositor_layers()
	await get_tree().process_frame
	await get_tree().process_frame
	var capture := get_viewport().get_texture().get_image()
	if capture.is_empty():
		push_error("Opening capture viewport returned an empty image.")
		get_tree().quit(1)
		return
	var save_error := capture.save_png(opening_capture_path)
	if save_error != OK:
		push_error(
			"Opening capture failed to save %s (error %d)."
			% [opening_capture_path, save_error]
		)
		get_tree().quit(1)
		return
	print(
		"[Godot Opening Capture] PASS beat=%d id=%s size=%dx%d path=%s transcript_exchanges=%d route_end=%s supplies_inspected=%s"
		% [
			opening_capture_beat,
			str(opening_beat.get("id", "")),
			capture.get_width(),
			capture.get_height(),
			opening_capture_path,
			int(live_client.call("consumed_exchange_count")),
			str(opening_capture_route_end),
			str(opening_capture_supplies_inspected),
		]
	)
	get_tree().quit(0)


func _replay_next_opening_capture_command() -> bool:
	if not opening_review_mode or not live_client.has_method("next_expected_command"):
		push_error(
			"Opening capture route reached awaiting=%s without an authoritative transcript command."
			% live_awaiting
		)
		return false
	var command := live_client.call("next_expected_command") as Dictionary
	if command.is_empty():
		push_error("Opening capture transcript command is unavailable: %s" % str(live_client.get("last_error")))
		return false
	var response: Dictionary = {}
	match str(command.get("type", "")):
		"apply_action":
			response = live_controller.call("apply_action", command.get("action", {}) as Dictionary) as Dictionary
		"advance_ai":
			response = live_controller.call("advance_ai") as Dictionary
		"choose_recovery":
			response = live_controller.call("choose_recovery", str(command.get("choice", ""))) as Dictionary
		_:
			push_error(
				"Opening capture transcript command '%s' cannot resolve awaiting=%s."
				% [str(command.get("type", "")), live_awaiting]
			)
			return false
	if response.is_empty() or not bool(response.get("ok", false)):
		push_error("Opening capture transcript command failed: %s" % str(live_controller.get("last_error")))
		return false
	return _accept_live_response(response, false)


func _accept_live_response(response: Dictionary, initial: bool) -> bool:
	if world_loop_mode:
		return _accept_world_loop_response(response, initial)
	var view_value: Variant = response.get("view")
	if typeof(view_value) != TYPE_DICTIONARY:
		live_error = "Authoritative response omitted its validated view."
		push_error(live_error)
		return false
	var view := view_value as Dictionary
	var previous_beat_id := str(opening_beat.get("id", ""))
	live_view = view.duplicate(true)
	live_awaiting = str(view.get("awaiting", ""))
	live_legal_actions = (view.get("legalActions", []) as Array).duplicate(true)
	opening_beat = (view.get("beat", {}) as Dictionary).duplicate(true)
	opening_party = (view.get("party", []) as Array).duplicate(true)
	opening_inventory = (view.get("inventory", {}) as Dictionary).duplicate(true)
	if initial or str(opening_beat.get("id", "")) != previous_beat_id:
		opening_traversal_progress = (
			1.0
			if str(opening_beat.get("objectiveKey", "")) == DEATH_ORDER_OBJECTIVE_KEY
			else 0.0
		)
		opening_traversal_target = -1.0
		opening_supplies_inspected = false
	live_error = ""
	live_status = _live_result_status(str(response.get("resultType", "")))
	live_selected_action = clampi(live_selected_action, 0, maxi(0, live_legal_actions.size() - 1))
	var encounter_value: Variant = view.get("encounter")
	var encounter := (
		(encounter_value as Dictionary).duplicate(true)
		if typeof(encounter_value) == TYPE_DICTIONARY
		else _opening_placeholder_encounter(opening_beat)
	)

	bridge = {
		"format": "deathstalker-godot-presentation-bridge",
		"schemaVersion": 1,
		"source": {
			"authoritativeRuntime": "typescript-core",
			"generator": "src/session/openingExpeditionProtocol.ts",
			"fixtureId": "opening-virimonde-forced-departure",
			"seed": int(view.get("seed", LIVE_SESSION_SEED)),
		},
		"encounter": encounter,
		"timing": {
			"frameStepSeconds": LIVE_FRAME_STEP_SECONDS,
			"endHoldSeconds": LIVE_END_HOLD_SECONDS,
			"durationSeconds": LIVE_END_HOLD_SECONDS,
		},
		"frames": [],
	}

	var transition_value: Variant = view.get("transition")
	if transition_value == null:
		live_current_state = _opening_empty_state()
		frames = [{
			"index": 0,
			"atSeconds": 0.0,
			"action": null,
			"state": live_current_state,
		}]
		playback_seconds = 0.0
		duration_seconds = LIVE_END_HOLD_SECONDS
		live_transition_playing = false
		live_transition_complete_at = 0.0
		if combat_audio != null:
			_reset_audio_cycle()
	elif typeof(transition_value) == TYPE_DICTIONARY:
		var transition := transition_value as Dictionary
		var state := transition.get("state", {}) as Dictionary
		var action_value: Variant = transition.get("action")
		if action_value == null:
			live_current_state = state.duplicate(true)
			frames = [{
				"index": 0,
				"atSeconds": 0.0,
				"action": null,
				"state": live_current_state,
			}]
			playback_seconds = 0.0
			duration_seconds = LIVE_END_HOLD_SECONDS
			live_transition_playing = false
			live_transition_complete_at = 0.0
			if combat_audio != null:
				_reset_audio_cycle()
		elif typeof(action_value) == TYPE_DICTIONARY:
			var previous_state := live_current_state.duplicate(true)
			var action := (action_value as Dictionary).duplicate(true)
			live_current_state = state.duplicate(true)
			frames = [
				{
					"index": 0,
					"atSeconds": 0.0,
					"action": null,
					"state": previous_state,
				},
				{
					"index": 1,
					"atSeconds": LIVE_FRAME_STEP_SECONDS,
					"action": action,
					"state": live_current_state,
				},
			]
			var timing := action.get("timing", {}) as Dictionary
			var action_duration := float(timing.get("durationSeconds", 0.3))
			duration_seconds = LIVE_FRAME_STEP_SECONDS + LIVE_END_HOLD_SECONDS
			live_transition_complete_at = LIVE_FRAME_STEP_SECONDS + action_duration + LIVE_RECOVERY_SECONDS
			playback_seconds = LIVE_FRAME_STEP_SECONDS
			live_transition_playing = true
			if combat_audio != null:
				_reset_audio_dispatch_state(false)
				_update_audio_schedule()
		else:
			live_error = "Opening combat transition action is malformed."
			push_error(live_error)
			return false
	else:
		live_error = "Opening transition is neither null nor a Dictionary."
		push_error(live_error)
		return false
	(bridge.get("timing", {}) as Dictionary)["durationSeconds"] = duration_seconds
	bridge["frames"] = frames
	if initial and not ["expedition_created", "expedition_resumed", "expedition_restarted"].has(str(response.get("resultType", ""))):
		live_error = "Opening initialization returned an unexpected result type."
		push_error(live_error)
		return false
	return true


func _accept_world_loop_response(response: Dictionary, initial: bool) -> bool:
	var view_value: Variant = response.get("view")
	if typeof(view_value) != TYPE_DICTIONARY:
		live_error = "Authoritative world-loop response omitted its validated view."
		push_error(live_error)
		return false
	var view := view_value as Dictionary
	var previous_location_id := str(world_loop_location.get("id", ""))
	live_view = view.duplicate(true)
	live_awaiting = str(view.get("awaiting", ""))
	live_legal_actions = (view.get("legalActions", []) as Array).duplicate(true)
	world_loop_location = (view.get("location", {}) as Dictionary).duplicate(true)
	world_loop_interactables = (view.get("interactables", []) as Array).duplicate(true)
	world_loop_campaign = (view.get("campaign", {}) as Dictionary).duplicate(true)
	world_loop_party = (view.get("party", []) as Array).duplicate(true)
	opening_beat = _world_loop_presentation_beat(world_loop_location)
	opening_party = world_loop_party.duplicate(true)
	opening_inventory = (world_loop_campaign.get("inventory", {}) as Dictionary).duplicate(true)
	if initial or str(world_loop_location.get("id", "")) != previous_location_id:
		world_loop_player_position = Vector2(960.0, 910.0)
		world_loop_move_target_x = -1.0
	live_error = ""
	live_status = _live_result_status(str(response.get("resultType", "")))
	live_selected_action = clampi(live_selected_action, 0, maxi(0, live_legal_actions.size() - 1))
	var encounter_value: Variant = view.get("encounter")
	var encounter := (
		(encounter_value as Dictionary).duplicate(true)
		if typeof(encounter_value) == TYPE_DICTIONARY
		else _world_loop_placeholder_encounter(world_loop_location)
	)
	bridge = {
		"format": "deathstalker-godot-presentation-bridge",
		"schemaVersion": 1,
		"source": {
			"authoritativeRuntime": "typescript-core",
			"generator": "src/session/worldLoopProtocol.ts",
			"fixtureId": "world-loop-proving-fixture",
			"seed": int(view.get("seed", LIVE_SESSION_SEED)),
		},
		"encounter": encounter,
		"timing": {
			"frameStepSeconds": LIVE_FRAME_STEP_SECONDS,
			"endHoldSeconds": LIVE_END_HOLD_SECONDS,
			"durationSeconds": LIVE_END_HOLD_SECONDS,
		},
		"frames": [],
	}
	var transition_value: Variant = view.get("transition")
	if transition_value == null:
		live_current_state = _world_loop_empty_state()
		frames = [{
			"index": 0,
			"atSeconds": 0.0,
			"action": null,
			"state": live_current_state,
		}]
		playback_seconds = 0.0
		duration_seconds = LIVE_END_HOLD_SECONDS
		live_transition_playing = false
		live_transition_complete_at = 0.0
		if combat_audio != null:
			_reset_audio_cycle()
	elif typeof(transition_value) == TYPE_DICTIONARY:
		var transition := transition_value as Dictionary
		var state := transition.get("state", {}) as Dictionary
		var action_value: Variant = transition.get("action")
		if action_value == null:
			live_current_state = state.duplicate(true)
			frames = [{
				"index": 0,
				"atSeconds": 0.0,
				"action": null,
				"state": live_current_state,
			}]
			playback_seconds = 0.0
			duration_seconds = LIVE_END_HOLD_SECONDS
			live_transition_playing = false
			live_transition_complete_at = 0.0
			if combat_audio != null:
				_reset_audio_cycle()
		elif typeof(action_value) == TYPE_DICTIONARY:
			var previous_state := live_current_state.duplicate(true)
			var action := (action_value as Dictionary).duplicate(true)
			live_current_state = state.duplicate(true)
			frames = [
				{
					"index": 0,
					"atSeconds": 0.0,
					"action": null,
					"state": previous_state,
				},
				{
					"index": 1,
					"atSeconds": LIVE_FRAME_STEP_SECONDS,
					"action": action,
					"state": live_current_state,
				},
			]
			var timing := action.get("timing", {}) as Dictionary
			var action_duration := float(timing.get("durationSeconds", 0.3))
			duration_seconds = LIVE_FRAME_STEP_SECONDS + LIVE_END_HOLD_SECONDS
			live_transition_complete_at = LIVE_FRAME_STEP_SECONDS + action_duration + LIVE_RECOVERY_SECONDS
			playback_seconds = LIVE_FRAME_STEP_SECONDS
			live_transition_playing = true
			if combat_audio != null:
				_reset_audio_dispatch_state(false)
				_update_audio_schedule()
		else:
			live_error = "World-loop combat transition action is malformed."
			push_error(live_error)
			return false
	else:
		live_error = "World-loop transition is neither null nor a Dictionary."
		push_error(live_error)
		return false
	(bridge.get("timing", {}) as Dictionary)["durationSeconds"] = duration_seconds
	bridge["frames"] = frames
	if initial and str(response.get("resultType", "")) != "world_loop_created":
		live_error = "World-loop initialization returned an unexpected result type."
		push_error(live_error)
		return false
	return true


func _world_loop_presentation_beat(location: Dictionary) -> Dictionary:
	var location_id := str(location.get("id", "safe_hub"))
	var environment_state := "ordinary"
	if location_id == "field_route":
		environment_state = "lake_route"
	elif location_id == "boss_approach":
		environment_state = "lake_departure"
	return {
		"id": location_id,
		"kind": "exploration",
		"objectiveKey": "world_loop.%s" % location_id,
		"environmentState": environment_state,
		"partyIds": world_loop_party.map(func(member: Dictionary) -> String: return str(member.get("id", ""))),
	}


func _world_loop_placeholder_encounter(location: Dictionary) -> Dictionary:
	return {
		"id": str(location.get("id", "world_loop")),
		"name": _world_loop_location_title(str(location.get("id", ""))),
		"tier": "skirmish",
		"description": "Noncanonical world-loop systems fixture.",
		"enemyIds": [],
		"grade": {
			"multiplyWash": "#000000",
			"screenLift": "#000000",
			"vignetteStrength": 0.55,
		},
		"environment": _opening_environment(str(opening_beat.get("environmentState", "ordinary"))),
	}


func _world_loop_empty_state() -> Dictionary:
	return {
		"encounterId": str(world_loop_location.get("id", "world_loop")),
		"battleMode": "range_band_prototype",
		"turnNumber": 0,
		"activeActorId": "",
		"status": "victory" if live_awaiting == "complete" else "in_progress",
		"inventory": (world_loop_campaign.get("inventory", {}) as Dictionary).duplicate(true),
		"combatants": [],
		"turnQueue": [],
		"events": [],
	}


func _world_loop_location_title(location_id: String) -> String:
	match location_id:
		"safe_hub": return "Proving Hub"
		"field_route": return "Field Route"
		"boss_approach": return "Boss Approach"
		_: return location_id.replace("_", " ").capitalize()


func _live_result_status(result_type: String) -> String:
	match result_type:
		"world_loop_created":
			return "World-loop proving fixture ready"
		"location_changed":
			return "Travel complete"
		"chest_opened":
			return "Chest reward claimed"
		"party_rested":
			return "Party fully rested"
		"shop_purchase_completed":
			return "Purchase completed"
		"encounter_started":
			return "Discrete encounter started"
		"battle_returned_to_map":
			return "Returned to exploration"
		"world_loop_restarted":
			return "World-loop proving fixture restarted"
		"expedition_created":
			return "Opening expedition ready"
		"expedition_resumed":
			return "Opening expedition resumed"
		"expedition_restarted":
			return "Opening expedition restarted"
		"beat_advanced":
			return "Opening beat advanced"
		"recovery_chosen":
			return "Recovery choice recorded"
		"action_applied":
			return "Player action resolved"
		"ai_action_applied":
			return "Enemy action resolved"
		_:
			return "Authoritative response received"


func _opening_empty_state() -> Dictionary:
	return {
		"encounterId": str(opening_beat.get("id", "opening")),
		"battleMode": "range_band_prototype",
		"turnNumber": 0,
		"activeActorId": "",
		"status": "victory" if live_awaiting == "complete" else "in_progress",
		"inventory": opening_inventory.duplicate(true),
		"combatants": [],
		"turnQueue": [],
		"events": [],
	}


func _opening_placeholder_encounter(beat: Dictionary) -> Dictionary:
	return {
		"id": str(beat.get("id", "opening")),
		"name": _opening_title(str(beat.get("objectiveKey", ""))),
		"tier": "skirmish",
		"description": "Authoritative opening expedition beat.",
		"enemyIds": [],
		"grade": {
			"multiplyWash": "#000000",
			"screenLift": "#000000",
			"vignetteStrength": 0.55,
		},
		"environment": _opening_environment(str(beat.get("environmentState", "ordinary"))),
	}


func _opening_environment(environment_state: String) -> Dictionary:
	var environment := {
		"type": "virimonde_fields",
		"lightSourceX": 0.42,
		"lightSourceY": 0.16,
		"lightColor": "#f4ddb0",
		"floorTint": "#3d5133",
		"hazeColor": "#718a7d",
		"stoneColor": "#646957",
		"metalColor": "#454b50",
		"shadowColor": "#152019",
		"accentColor": "#8fb65a",
	}
	if environment_state in ["flyer_wreck", "escape_pod_impact"]:
		environment["type"] = "virimonde_crash_site"
		environment["lightSourceX"] = 0.68
		environment["lightColor"] = "#ffd27a"
		environment["accentColor"] = "#e66b32"
	elif environment_state in ["lake_route", "lake_approach", "lake_departure"]:
		environment["type"] = "virimonde_departure"
		environment["lightSourceX"] = 0.76
		environment["hazeColor"] = "#846f61"
		environment["accentColor"] = "#d99a4e"
	elif environment_state == "yacht_safety":
		environment["type"] = "yacht_safety"
		environment["lightColor"] = "#9fc8ff"
		environment["floorTint"] = "#171d28"
		environment["hazeColor"] = "#25354a"
		environment["shadowColor"] = "#050812"
		environment["accentColor"] = "#63e6ff"
	return environment


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


func _configure_combat_audio() -> bool:
	combat_audio = CombatAudio.new()
	combat_audio.name = "HybridCombatAudio"
	combat_audio.set_output_suppressed(smoke_mode)
	add_child(combat_audio)

	# Default bridge smoke remains independent of owner-only assets. Passing an
	# explicit mode still exercises that route in a headless integration check.
	var effective_mode := (
		"procedural"
		if smoke_mode and requested_audio_mode == "auto"
		else requested_audio_mode
	)
	if effective_mode != "procedural":
		var licensed_bank := LicensedCueBank.new()
		licensed_bank.name = "LicensedCueBank"
		licensed_bank.set_output_suppressed(smoke_mode)
		if not licensed_bank.configure(
			LICENSED_AUDIO_MANIFEST_PATH,
			LICENSED_AUDIO_ROOT
		):
			licensed_bank.free()
			return false
		if not combat_audio.install_licensed_bank(licensed_bank):
			licensed_bank.free()
			return false
	if not combat_audio.configure_audio_mode(effective_mode):
		return false
	print(
		"[Godot Combat Audio] mode=%s requested=%s licensed_bank=%s staged_assets_owner_only=true"
		% [effective_mode, requested_audio_mode, combat_audio.licensed_bank_state()]
	)
	return true


func _process(delta: float) -> void:
	frame_samples.append(delta * 1000.0)
	if frame_samples.size() > 120:
		frame_samples.pop_front()
	if live_mode:
		_process_live(delta)
		_refresh_dynamic_compositor_layers()
		return
	if not paused:
		var remaining := delta * playback_rate
		while remaining > 0.0:
			var until_loop_end := duration_seconds - playback_seconds
			if remaining < until_loop_end:
				playback_seconds += remaining
				remaining = 0.0
				_update_audio_schedule()
				continue

			playback_seconds = duration_seconds
			_update_audio_schedule()
			remaining -= until_loop_end
			if smoke_mode:
				_refresh_dynamic_compositor_layers()
				if not _validate_audio_dispatch_cycle():
					_schedule_smoke_exit(1)
					return
				if not _validate_audio_replay_reset():
					_schedule_smoke_exit(1)
					return
				print(
					"[Godot Presentation] Replay complete: %d/%d serialized snapshots rendered with contact-gated results at %.1fx."
					% [frames.size(), frames.size(), playback_rate]
				)
				_schedule_smoke_exit(0)
				return

			playback_seconds = 0.0
			_reset_audio_cycle()
			_update_audio_schedule()
	_refresh_dynamic_compositor_layers()


func _process_live(delta: float) -> void:
	if not paused:
		if world_loop_mode:
			_process_world_loop_exploration(delta)
		else:
			_process_opening_traversal(delta)
	if paused:
		return
	if not live_transition_playing:
		if world_loop_mode and live_awaiting == "ai":
			_request_live_ai()
		elif world_loop_mode and live_awaiting == "return":
			_return_world_loop_to_map()
		return
	playback_seconds = minf(live_transition_complete_at, playback_seconds + delta)
	_update_audio_schedule()
	if playback_seconds < live_transition_complete_at:
		return
	live_transition_playing = false
	if live_awaiting == "ai":
		_request_live_ai()
	elif world_loop_mode and live_awaiting == "return":
		_return_world_loop_to_map()
	elif live_awaiting == "complete":
		live_status = (
			"Fixed boss defeated — proving loop complete; press R to replay"
			if world_loop_mode
			else "Opening expedition complete — press R to replay"
		)
	elif world_loop_mode and live_awaiting == "explore":
		live_status = "Explore, gather supplies, shop, rest, or choose the next fight"
	elif live_awaiting == "continue":
		live_status = "Continue the opening expedition"
	elif live_awaiting == "choice":
		live_status = "Choose recovery or continue"
	elif live_awaiting == "failed":
		live_status = "Expedition failed — press R to restart"
	else:
		live_status = "Choose an authoritative action"


func _process_world_loop_exploration(delta: float) -> void:
	if live_awaiting != "explore" or live_transition_playing:
		world_loop_move_target_x = -1.0
		return
	var direction := 0.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
		direction += 1.0
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
		direction -= 1.0
	if not is_zero_approx(direction):
		world_loop_move_target_x = -1.0
		world_loop_player_position.x = clampf(
			world_loop_player_position.x + direction * WORLD_LOOP_MOVE_SPEED * delta,
			WORLD_LOOP_STAGE_MIN_X,
			WORLD_LOOP_STAGE_MAX_X
		)
	elif world_loop_move_target_x >= 0.0:
		world_loop_player_position.x = move_toward(
			world_loop_player_position.x,
			world_loop_move_target_x,
			WORLD_LOOP_MOVE_SPEED * delta
		)
		if is_equal_approx(world_loop_player_position.x, world_loop_move_target_x):
			world_loop_move_target_x = -1.0
	var nearby := _world_loop_nearby_interactable()
	live_status = (
		"ENTER / E  %s — %s" % [str(nearby.get("label", "Interact")), str(nearby.get("detail", ""))]
		if not nearby.is_empty()
		else "Move A/D or left/right; approach a marker to interact"
	)


func _world_loop_interactable_position(interactable: Dictionary) -> Vector2:
	var location_id := str(world_loop_location.get("id", ""))
	var interaction_id := str(interactable.get("id", ""))
	if location_id == "safe_hub":
		match interaction_id:
			"rest": return Vector2(455.0, 890.0)
			"buy_medkit": return Vector2(790.0, 890.0)
			"buy_revive": return Vector2(1045.0, 890.0)
			"field_route": return Vector2(1570.0, 875.0)
	elif location_id == "field_route":
		match interaction_id:
			"safe_hub": return Vector2(285.0, 900.0)
			"field_cache_a": return Vector2(600.0, 885.0)
			"field_patrol": return Vector2(935.0, 875.0)
			"field_cache_b": return Vector2(1260.0, 885.0)
			"boss_approach": return Vector2(1605.0, 885.0)
	elif location_id == "boss_approach":
		match interaction_id:
			"field_route": return Vector2(300.0, 895.0)
			"fixed_boss": return Vector2(1230.0, 875.0)
	return Vector2(960.0, 890.0)


func _world_loop_nearby_interactable() -> Dictionary:
	var nearest: Dictionary = {}
	var nearest_distance := WORLD_LOOP_INTERACTION_RANGE
	for interactable_value: Variant in world_loop_interactables:
		if typeof(interactable_value) != TYPE_DICTIONARY:
			continue
		var interactable := interactable_value as Dictionary
		if not bool(interactable.get("available", false)):
			continue
		var distance := absf(
			_world_loop_interactable_position(interactable).x - world_loop_player_position.x
		)
		if distance <= nearest_distance:
			nearest = interactable
			nearest_distance = distance
	return nearest


func _activate_world_loop_interactable() -> void:
	if paused or live_transition_playing or live_awaiting != "explore":
		return
	var interactable := _world_loop_nearby_interactable()
	if interactable.is_empty():
		live_status = "Move closer to an available marker"
		return
	var interaction_id := str(interactable.get("id", ""))
	var response: Dictionary = {}
	match str(interactable.get("type", "")):
		"travel":
			response = live_controller.call("travel", interaction_id) as Dictionary
		"chest":
			response = live_controller.call("open_chest", interaction_id) as Dictionary
		"encounter":
			response = live_controller.call("start_encounter", interaction_id) as Dictionary
		"rest":
			response = live_controller.call("rest") as Dictionary
		"shop":
			response = live_controller.call(
				"buy_consumable",
				"medkit" if interaction_id == "buy_medkit" else "revive"
			) as Dictionary
	if response.is_empty() or not bool(response.get("ok", false)):
		_live_request_failed("World-loop interaction")
		return
	if not _accept_live_response(response, false):
		_live_request_failed("World-loop transition")


func _return_world_loop_to_map() -> void:
	live_status = "Returning to the field…"
	var response := live_controller.call("return_to_map") as Dictionary
	if response.is_empty() or not bool(response.get("ok", false)):
		_live_request_failed("Battle return")
		return
	if not _accept_live_response(response, false):
		_live_request_failed("Battle return transition")


func _process_opening_traversal(delta: float) -> void:
	if not _opening_traversal_active():
		opening_traversal_target = -1.0
		return
	var direction := 0.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
		direction += 1.0
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
		direction -= 1.0
	if not is_zero_approx(direction):
		opening_traversal_target = -1.0
		opening_traversal_progress = clampf(
			opening_traversal_progress + direction * OPENING_TRAVERSAL_SPEED * delta,
			0.0,
			1.0
		)
	elif opening_traversal_target >= 0.0:
		opening_traversal_progress = move_toward(
			opening_traversal_progress,
			opening_traversal_target,
			OPENING_TRAVERSAL_SPEED * delta
		)
		if is_equal_approx(opening_traversal_progress, opening_traversal_target):
			opening_traversal_target = -1.0
	if _opening_traversal_complete():
		if _opening_objective_key() == DEATH_ORDER_OBJECTIVE_KEY:
			live_status = "Clear of the Standing — continue"
		else:
			live_status = (
				"Supplies inspected — finish"
				if opening_supplies_inspected
				else "Supplies reached — inspect"
			)
	else:
		live_status = (
			"Break from the Standing personnel"
			if _opening_objective_key() == DEATH_ORDER_OBJECTIVE_KEY
			else "Follow the Virimonde route"
		)


func _opening_traversal_active() -> bool:
	return (
		opening_mode
		and live_awaiting == "continue"
		and _opening_objective_key() in [
			OPENING_TRAVERSAL_OBJECTIVE_KEY,
			DEATH_ORDER_OBJECTIVE_KEY,
		]
		and (live_current_state.get("combatants", []) as Array).is_empty()
	)


func _opening_traversal_complete() -> bool:
	if not _opening_traversal_active():
		return true
	if _opening_objective_key() == DEATH_ORDER_OBJECTIVE_KEY:
		return opening_traversal_progress <= 0.001
	return opening_traversal_progress >= 0.999


func _opening_traversal_destination_progress() -> float:
	return 0.0 if _opening_objective_key() == DEATH_ORDER_OBJECTIVE_KEY else 1.0


func _opening_objective_key() -> String:
	return str(opening_beat.get("objectiveKey", ""))


func _set_opening_traversal_target(screen_position: Vector2) -> void:
	if not _opening_traversal_active():
		return
	opening_traversal_target = clampf(
		(screen_position.x - OPENING_TRAVERSAL_START.x)
		/ (OPENING_TRAVERSAL_END.x - OPENING_TRAVERSAL_START.x),
		0.0,
		1.0
	)


func _request_live_ai() -> void:
	live_status = "Resolving enemy action…"
	var response: Dictionary = live_controller.call("advance_ai") as Dictionary
	if response.is_empty() or not bool(response.get("ok", false)):
		_live_request_failed("Enemy action")
		return
	if not _accept_live_response(response, false):
		_live_request_failed("Enemy transition")


func _submit_live_action(action_index: int) -> void:
	if (
		live_transition_playing
		or paused
		or live_awaiting != "player"
		or action_index < 0
		or action_index >= live_legal_actions.size()
	):
		return
	live_selected_action = action_index
	live_status = "Resolving player action…"
	var action := (live_legal_actions[action_index] as Dictionary).duplicate(true)
	var response: Dictionary = live_controller.call("apply_action", action) as Dictionary
	if response.is_empty() or not bool(response.get("ok", false)):
		_live_request_failed("Player action")
		return
	if not _accept_live_response(response, false):
		_live_request_failed("Player transition")


func _advance_opening() -> void:
	if live_transition_playing or paused or live_awaiting != "continue":
		return
	if not _opening_traversal_complete():
		live_status = "Reach the gold marker before continuing"
		return
	if (
		_opening_objective_key() == OPENING_TRAVERSAL_OBJECTIVE_KEY
		and not opening_supplies_inspected
	):
		opening_supplies_inspected = true
		live_status = "Starting supplies inspected"
		_refresh_dynamic_compositor_layers()
		return
	live_status = "Advancing opening expedition…"
	var response: Dictionary = live_controller.call("continue_expedition") as Dictionary
	if response.is_empty() or not bool(response.get("ok", false)):
		_live_request_failed("Opening advance")
		return
	if not _accept_live_response(response, false):
		_live_request_failed("Opening transition")


func _choose_opening_recovery(choice_index: int) -> void:
	if live_transition_playing or paused or live_awaiting != "choice":
		return
	var choices: Array[String] = ["use_medkit", "continue"]
	if choice_index < 0 or choice_index >= choices.size():
		return
	live_selected_action = choice_index
	live_status = "Recording recovery choice…"
	var response: Dictionary = live_controller.call("choose_recovery", choices[choice_index]) as Dictionary
	if response.is_empty() or not bool(response.get("ok", false)):
		_live_request_failed("Recovery choice")
		return
	if not _accept_live_response(response, false):
		_live_request_failed("Recovery transition")


func _live_request_failed(context: String) -> void:
	live_transition_playing = false
	live_error = "%s failed: %s" % [context, str(live_controller.get("last_error"))]
	live_status = "Recovery required — press R to restart"
	push_error("[Godot Live Session] %s" % live_error)


func _unhandled_input(event: InputEvent) -> void:
	if live_mode and event is InputEventMouseButton:
		var mouse_event := event as InputEventMouseButton
		if mouse_event.pressed and mouse_event.button_index == MOUSE_BUTTON_LEFT:
			if (
				world_loop_mode
				and live_awaiting == "explore"
				and mouse_event.position.x <= 1770.0
				and mouse_event.position.y >= 650.0
			):
				world_loop_move_target_x = clampf(
					mouse_event.position.x,
					WORLD_LOOP_STAGE_MIN_X,
					WORLD_LOOP_STAGE_MAX_X
				)
				_refresh_dynamic_compositor_layers()
				get_viewport().set_input_as_handled()
				return
			var prompt_buttons := _opening_prompt_buttons()
			for button_index in prompt_buttons.size():
				var button := prompt_buttons[button_index] as Dictionary
				if (button.get("rect", Rect2()) as Rect2).has_point(mouse_event.position):
					if live_awaiting == "continue":
						_advance_opening()
					elif live_awaiting == "choice":
						_choose_opening_recovery(button_index)
					_refresh_dynamic_compositor_layers()
					get_viewport().set_input_as_handled()
					return
			for action_index in live_legal_actions.size():
				if _live_action_rect(action_index).has_point(mouse_event.position):
					_submit_live_action(action_index)
					_refresh_dynamic_compositor_layers()
					get_viewport().set_input_as_handled()
					return
			if (
				_opening_traversal_active()
				and mouse_event.position.x <= 1080.0
				and mouse_event.position.y >= 650.0
			):
				_set_opening_traversal_target(mouse_event.position)
				_refresh_dynamic_compositor_layers()
				get_viewport().set_input_as_handled()
				return
		return
	if not event is InputEventKey or not event.pressed or event.echo:
		return
	var key_event := event as InputEventKey
	var handled := true
	if live_mode and key_event.keycode >= KEY_1 and key_event.keycode <= KEY_9:
		var selected_index := int(key_event.keycode) - int(KEY_1)
		if live_awaiting == "choice":
			_choose_opening_recovery(selected_index)
		else:
			_submit_live_action(selected_index)
	elif key_event.keycode >= KEY_F1 and key_event.keycode <= KEY_F9:
		_toggle_compositor_layer(int(key_event.keycode) - int(KEY_F1))
	else:
		match key_event.keycode:
			KEY_SPACE:
				if not live_mode or live_transition_playing:
					paused = not paused
			KEY_R:
				if live_mode:
					_restart_live_session()
				else:
					_restart_replay()
			KEY_UP:
				var option_count_up := _opening_option_count()
				if live_mode and option_count_up > 0:
					live_selected_action = posmod(live_selected_action - 1, option_count_up)
				else:
					handled = false
			KEY_DOWN:
				var option_count_down := _opening_option_count()
				if live_mode and option_count_down > 0:
					live_selected_action = posmod(live_selected_action + 1, option_count_down)
				else:
					handled = false
			KEY_ENTER, KEY_KP_ENTER:
				if live_mode:
					if world_loop_mode and live_awaiting == "explore":
						_activate_world_loop_interactable()
					elif live_awaiting == "continue":
						_advance_opening()
					elif live_awaiting == "choice":
						_choose_opening_recovery(live_selected_action)
					else:
						_submit_live_action(live_selected_action)
				else:
					handled = false
			KEY_E:
				if world_loop_mode and live_awaiting == "explore":
					_activate_world_loop_interactable()
				else:
					handled = false
			KEY_TAB:
				show_overlay = not show_overlay
			KEY_F12:
				diagnostic_compositor = not diagnostic_compositor
				_apply_diagnostic_layout()
			KEY_F10:
				_restore_compositor_layers()
			KEY_ESCAPE:
				get_tree().quit()
			_:
				handled = false
	if handled:
		_refresh_dynamic_compositor_layers()
		get_viewport().set_input_as_handled()


func _restart_live_session() -> void:
	paused = false
	live_status = "Restarting authoritative session…"
	var response: Dictionary = (
		live_controller.call("restart_world_loop") as Dictionary
		if world_loop_mode
		else live_controller.call("restart_expedition") as Dictionary
	)
	if response.is_empty() or not bool(response.get("ok", false)):
		_live_request_failed("Restart")
		return
	if not _accept_live_response(response, true):
		_live_request_failed("Restart transition")
		return
	_reset_audio_cycle()
	_update_audio_schedule()


func _restart_replay() -> void:
	playback_seconds = 0.0
	_reset_audio_cycle()
	_update_audio_schedule()
	_refresh_dynamic_compositor_layers()


func _schedule_smoke_exit(exit_code: int) -> void:
	paused = true
	combat_audio.shutdown()
	combat_audio.queue_free()
	combat_audio = null
	get_tree().create_timer(0.20).timeout.connect(_quit_after_smoke.bind(exit_code))


func _quit_after_smoke(exit_code: int) -> void:
	get_tree().quit(exit_code)


func _reset_audio_cycle() -> void:
	_reset_audio_dispatch_state(true)


func _reset_audio_dispatch_state(reset_variation: bool) -> void:
	if reset_variation:
		combat_audio.reset_variation_sequence()
	audio_action_frame_ledger.clear()
	audio_event_frame_ledger.clear()
	audio_action_frames_seen = 0
	audio_null_action_cues = 0
	audio_action_cue_dispatches = 0
	audio_event_cue_dispatches = 0
	audio_supported_dispatches = 0
	audio_silent_dispatches = 0
	audio_render_ready_dispatches = 0
	audio_render_failures = 0
	audio_licensed_dispatches = 0
	audio_procedural_dispatches = 0


func _update_audio_schedule() -> void:
	var current_frame_index := _current_frame_index()
	for frame_index in range(current_frame_index + 1):
		_dispatch_action_audio(frame_index)

	for frame_index in range(1, current_frame_index + 1):
		if audio_event_frame_ledger.has(frame_index):
			continue
		var frame := frames[frame_index] as Dictionary
		var action := frame.get("action", {}) as Dictionary
		var event_at := float(frame.get("atSeconds", 0.0)) + _action_result_anchor(action)
		if playback_seconds < event_at:
			continue
		audio_event_frame_ledger[frame_index] = true
		var state := frame.get("state", {}) as Dictionary
		var events := state.get("events", []) as Array
		for event_index in events.size():
			var serialized_event := events[event_index] as Dictionary
			var audio_cues := serialized_event.get("audioCues", []) as Array
			for cue_index in audio_cues.size():
				audio_event_cue_dispatches += 1
				_route_semantic_audio(
					StringName(str(audio_cues[cue_index])),
					"frame %d event %d cue %d" % [frame_index, event_index, cue_index]
				)


func _dispatch_action_audio(frame_index: int) -> void:
	if audio_action_frame_ledger.has(frame_index):
		return
	audio_action_frame_ledger[frame_index] = true
	var frame := frames[frame_index] as Dictionary
	var action_value: Variant = frame.get("action")
	if typeof(action_value) != TYPE_DICTIONARY:
		return

	audio_action_frames_seen += 1
	var action := action_value as Dictionary
	var cue_value: Variant = action.get("audioCue")
	if cue_value == null:
		audio_null_action_cues += 1
		return
	audio_action_cue_dispatches += 1
	_route_semantic_audio(StringName(str(cue_value)), "frame %d action" % frame_index)


func _route_semantic_audio(cue_id: StringName, source_label: String) -> void:
	if not combat_audio.supports_cue(cue_id):
		audio_silent_dispatches += 1
		if not logged_unsupported_audio_cues.has(cue_id):
			logged_unsupported_audio_cues[cue_id] = true
			print(
				"[Godot Combat Audio] Semantic cue '%s' is unsupported; explicit silence (%s, logged once)."
				% [cue_id, source_label]
			)
		return

	audio_supported_dispatches += 1
	var metrics: Dictionary = combat_audio.play_cue(cue_id)
	var render_ready: bool = (
		not metrics.is_empty()
		and (
			bool(metrics.get("playback_ready", false))
			or (
				bool(metrics.get("finite", false))
				and float(metrics.get("peak", 0.0)) > 0.01
				and (
					combat_audio.is_output_suppressed()
					or bool(metrics.get("generator_ready", false))
				)
			)
		)
	)
	if render_ready:
		if str(metrics.get("source", "procedural")) == "licensed":
			audio_licensed_dispatches += 1
		else:
			audio_procedural_dispatches += 1
		audio_render_ready_dispatches += 1
		return
	audio_render_failures += 1
	push_error("Combat audio cue '%s' failed render/output readiness at %s." % [cue_id, source_label])


func _validate_audio_dispatch_cycle() -> bool:
	var expected_action_frames := 0
	var expected_null_action_cues := 0
	var expected_action_cues := 0
	var expected_event_cues := 0
	var expected_supported_cues := 0
	var held_interrupt_count := 0
	var held_interrupt_event_audio_present := false

	for frame_index in frames.size():
		var frame := frames[frame_index] as Dictionary
		var action_value: Variant = frame.get("action")
		if typeof(action_value) == TYPE_DICTIONARY:
			expected_action_frames += 1
			var action := action_value as Dictionary
			var action_cue_value: Variant = action.get("audioCue")
			if action_cue_value == null:
				expected_null_action_cues += 1
			else:
				expected_action_cues += 1
				if combat_audio.supports_cue(StringName(str(action_cue_value))):
					expected_supported_cues += 1

		if frame_index == 0:
			continue
		var state := frame.get("state", {}) as Dictionary
		var events := state.get("events", []) as Array
		for serialized_event_value in events:
			var serialized_event := serialized_event_value as Dictionary
			var audio_cues := serialized_event.get("audioCues", []) as Array
			if str(serialized_event.get("type", "")) == "disruptor_interrupt":
				held_interrupt_count += 1
				if not audio_cues.is_empty():
					held_interrupt_event_audio_present = true
			for cue_value in audio_cues:
				expected_event_cues += 1
				if combat_audio.supports_cue(StringName(str(cue_value))):
					expected_supported_cues += 1

	var passed := true
	if audio_action_frame_ledger.size() != frames.size():
		push_error("Audio action ledger did not visit every serialized frame exactly once.")
		passed = false
	if audio_event_frame_ledger.size() != maxi(0, frames.size() - 1):
		push_error("Audio event ledger did not visit every transition result anchor exactly once.")
		passed = false
	if audio_action_frames_seen != expected_action_frames:
		push_error("Audio action frame dispatch count does not match the bridge document.")
		passed = false
	if audio_null_action_cues != expected_null_action_cues:
		push_error("Null action cue silence count does not match the bridge document.")
		passed = false
	if audio_action_cue_dispatches != expected_action_cues:
		push_error("Action audio cues were not dispatched exactly once.")
		passed = false
	if audio_event_cue_dispatches != expected_event_cues:
		push_error("Event audio cue entries were not dispatched exactly once at result contact.")
		passed = false
	if audio_supported_dispatches != expected_supported_cues:
		push_error("Supported semantic cue dispatch count does not match the bridge document.")
		passed = false
	var expected_silent_cues := expected_action_cues + expected_event_cues - expected_supported_cues
	if audio_silent_dispatches != expected_silent_cues:
		push_error("Unsupported semantic cues did not remain explicit silence.")
		passed = false
	if audio_render_ready_dispatches != expected_supported_cues or audio_render_failures != 0:
		push_error("A supported semantic cue failed deterministic render/output readiness.")
		passed = false
	if combat_audio.get_variation_sequence() != expected_supported_cues:
		push_error("Deterministic variation sequence did not advance once per supported cue.")
		passed = false
	if held_interrupt_event_audio_present:
		push_error("Held disruptor interrupt retained duplicate event audio routing.")
		passed = false
	if fixture_name == "range-band" and held_interrupt_count != 2:
		push_error(
			"Range-band smoke expected two serialized held interrupts; received %d."
			% held_interrupt_count
		)
		passed = false
	if not combat_audio.is_output_suppressed():
		push_error("Headless bridge smoke did not suppress audible output.")
		passed = false

	if passed:
		print(
			"[Godot Combat Audio] PASS fixture=%s frames=%d actions=%d action_cues=%d event_cues=%d rendered=%d licensed=%d procedural=%d silent=%d variation_steps=%d held_interrupts=%d duplicate_interrupt_event_audio=0 output_suppressed=true"
			% [
				fixture_name,
				audio_action_frame_ledger.size(),
				audio_action_frames_seen,
				audio_action_cue_dispatches,
				audio_event_cue_dispatches,
				audio_render_ready_dispatches,
				audio_licensed_dispatches,
				audio_procedural_dispatches,
				audio_silent_dispatches,
				combat_audio.get_variation_sequence(),
				held_interrupt_count,
			]
		)
	return passed


func _validate_audio_replay_reset() -> bool:
	var had_dispatched_audio_state := combat_audio.get_variation_sequence() > 0
	_restart_replay()
	var passed := true
	if not had_dispatched_audio_state:
		push_error("Headless semantic dispatch did not advance audio state before reset validation.")
		passed = false
	if not is_zero_approx(playback_seconds):
		push_error("Shared R/loop reset did not rewind presentation playback.")
		passed = false
	if audio_action_frame_ledger.size() != 1 or audio_event_frame_ledger.size() != 0:
		push_error("Shared R/loop reset did not clear both semantic audio ledgers.")
		passed = false
	if (
		audio_action_frames_seen != 0
		or audio_action_cue_dispatches != 0
		or audio_event_cue_dispatches != 0
		or audio_supported_dispatches != 0
		or audio_licensed_dispatches != 0
		or audio_procedural_dispatches != 0
	):
		push_error("Shared R/loop reset retained semantic dispatch counters.")
		passed = false
	if combat_audio.get_variation_sequence() != 0:
		push_error("Shared R/loop reset did not restore variation step 1 of 6.")
		passed = false
	if combat_audio.get_pending_frame_count() != 0 or combat_audio.has_active_playback():
		push_error("Shared R/loop reset did not stop and clear queued playback.")
		passed = false
	if passed:
		print(
			"[Godot Combat Audio] PASS shared R/loop reset clears playback, ledgers, and variation sequence."
		)
	return passed


func render_snapshot() -> Dictionary:
	if bridge.is_empty() or frames.is_empty():
		return {}
	var frame_index := _current_frame_index()
	var frame := frames[frame_index] as Dictionary
	var action_value: Variant = frame.get("action")
	var action := action_value as Dictionary if typeof(action_value) == TYPE_DICTIONARY else {}
	var action_elapsed := _action_elapsed(frame)
	var progress := _action_progress(frame)
	var state := _visible_state(frame_index, frame, action, action_elapsed)
	var positions := _unit_positions(state, action, progress)
	return {
		"bridge": bridge,
		"frame": frame,
		"frame_index": frame_index,
		"frame_count": frames.size(),
		"state": state,
		"action": action,
		"action_elapsed": action_elapsed,
		"action_progress": progress,
		"positions": positions,
		"playback_seconds": playback_seconds,
		"duration_seconds": duration_seconds,
		"paused": paused,
		"show_overlay": show_overlay,
		"ambient_particles": ambient_particles,
		"environment_textures": runtime_environment_textures,
		"frame_samples": frame_samples,
		"layer_visibility": layer_visibility,
		"diagnostic_compositor": diagnostic_compositor,
		"live_mode": live_mode,
		"live_awaiting": live_awaiting,
		"live_status": live_status,
		"live_error": live_error,
		"live_sequence": int(live_controller.get("sequence")) if live_controller != null else 0,
		"live_retry_count": int(live_controller.get("retry_count")) if live_controller != null else 0,
		"live_request_ms": live_client.last_request_ms if live_client != null else 0.0,
		"live_transition_playing": live_transition_playing,
		"live_action_menu": _live_action_menu(),
		"opening_mode": opening_mode,
		"world_loop_mode": world_loop_mode,
		"world_loop_location": world_loop_location,
		"world_loop_interactables": world_loop_interactables,
		"world_loop_markers": _world_loop_markers(),
		"world_loop_campaign": world_loop_campaign,
		"world_loop_party": world_loop_party,
		"world_loop_player_position": world_loop_player_position,
		"world_loop_nearby_interactable": _world_loop_nearby_interactable(),
		"world_loop_boss_defeated": bool(live_view.get("bossDefeated", false)),
		"world_loop_rest_count": int(live_view.get("restCount", 0)),
		"world_loop_last_event": str(live_view.get("lastEvent", "")),
		"opening_beat": opening_beat,
		"opening_beat_index": int(live_view.get("beatIndex", 0)),
		"opening_beat_count": int(live_view.get("beatCount", 10)),
		"opening_party": opening_party,
		"opening_inventory": opening_inventory,
		"opening_recovery_choice": live_view.get("recoveryChoice"),
		"opening_traversal_active": _opening_traversal_active(),
		"opening_traversal_progress": opening_traversal_progress,
		"opening_traversal_position": OPENING_TRAVERSAL_START.lerp(
			OPENING_TRAVERSAL_END,
			opening_traversal_progress
		),
		"opening_traversal_end": OPENING_TRAVERSAL_END,
		"opening_traversal_target_position": (
			OPENING_TRAVERSAL_START
			if _opening_objective_key() == DEATH_ORDER_OBJECTIVE_KEY
			else OPENING_TRAVERSAL_END
		),
		"opening_traversal_complete": _opening_traversal_complete(),
		"opening_supplies_inspected": opening_supplies_inspected,
		"opening_prompt_buttons": _opening_prompt_buttons(),
		"opening_persistence_available": bool(live_client.get("opening_persistence_available")) if live_client != null else false,
		"opening_checkpoint_sequence": int(live_client.get("opening_checkpoint_sequence")) if live_client != null else -1,
	}


func _world_loop_markers() -> Array[Dictionary]:
	var markers: Array[Dictionary] = []
	var nearby := _world_loop_nearby_interactable()
	var nearby_id := str(nearby.get("id", ""))
	for interactable_value: Variant in world_loop_interactables:
		if typeof(interactable_value) != TYPE_DICTIONARY:
			continue
		var interactable := interactable_value as Dictionary
		markers.append({
			"id": str(interactable.get("id", "")),
			"type": str(interactable.get("type", "")),
			"label": str(interactable.get("label", "")),
			"detail": str(interactable.get("detail", "")),
			"available": bool(interactable.get("available", false)),
			"nearby": str(interactable.get("id", "")) == nearby_id,
			"position": _world_loop_interactable_position(interactable),
		})
	return markers


func _opening_option_count() -> int:
	if live_awaiting == "player":
		return live_legal_actions.size()
	if live_awaiting == "choice":
		return 2
	if live_awaiting == "continue":
		return 1
	return 0


func _opening_prompt_buttons() -> Array[Dictionary]:
	var buttons: Array[Dictionary] = []
	if not opening_mode or live_transition_playing or paused:
		return buttons
	var origin := Vector2(
		1195.0,
		464.0
		if _opening_objective_key() == OPENING_TRAVERSAL_OBJECTIVE_KEY and opening_supplies_inspected
		else 400.0
	)
	var size := Vector2(500.0, 56.0)
	if live_awaiting == "continue":
		if _opening_traversal_active() and not _opening_traversal_complete():
			return buttons
		buttons.append({
			"index": 0,
			"label": (
				"Leave the Standing"
				if _opening_objective_key() == DEATH_ORDER_OBJECTIVE_KEY
				else "Finish inspection"
				if _opening_objective_key() == OPENING_TRAVERSAL_OBJECTIVE_KEY and opening_supplies_inspected
				else "Inspect supplies"
				if _opening_objective_key() == OPENING_TRAVERSAL_OBJECTIVE_KEY
				else "Continue"
			),
			"rect": Rect2(origin, size),
			"selected": true,
		})
	elif live_awaiting == "choice":
		buttons.append({
			"index": 0,
			"label": "Use 1 Medkit",
			"rect": Rect2(origin, size),
			"selected": live_selected_action == 0,
		})
		buttons.append({
			"index": 1,
			"label": "Continue without recovery",
			"rect": Rect2(origin + Vector2(0.0, 64.0), size),
			"selected": live_selected_action == 1,
		})
	return buttons


func _live_action_menu() -> Array[Dictionary]:
	var items: Array[Dictionary] = []
	if not live_mode:
		return items
	for action_index in live_legal_actions.size():
		var action := live_legal_actions[action_index] as Dictionary
		items.append({
			"index": action_index,
			"label": _live_action_label(action),
			"rect": _live_action_rect(action_index),
			"selected": action_index == live_selected_action,
			"enabled": live_awaiting == "player" and not live_transition_playing and not paused,
		})
	return items


func _live_action_rect(action_index: int) -> Rect2:
	return Rect2(
		_live_action_menu_origin() + Vector2(0.0, float(action_index) * (LIVE_ACTION_MENU_SIZE.y + LIVE_ACTION_MENU_GAP)),
		LIVE_ACTION_MENU_SIZE
	)


func _live_action_menu_origin() -> Vector2:
	var state := live_current_state
	var actor_id := str(state.get("activeActorId", ""))
	var positions := _unit_positions(state, {}, 1.0)
	var actor_position: Vector2 = positions.get(actor_id, Vector2(1400.0, 780.0))
	var menu_height := (
		float(live_legal_actions.size()) * LIVE_ACTION_MENU_SIZE.y
		+ float(maxi(0, live_legal_actions.size() - 1)) * LIVE_ACTION_MENU_GAP
	)
	var x := actor_position.x + LIVE_ACTION_MENU_ACTOR_GAP
	if x + LIVE_ACTION_MENU_SIZE.x > 1920.0 - LIVE_ACTION_MENU_MARGIN:
		x = actor_position.x - LIVE_ACTION_MENU_SIZE.x - LIVE_ACTION_MENU_ACTOR_GAP
	var y := actor_position.y - menu_height - LIVE_ACTION_MENU_VERTICAL_LIFT
	return Vector2(
		clampf(x, LIVE_ACTION_MENU_MARGIN, 1920.0 - LIVE_ACTION_MENU_SIZE.x - LIVE_ACTION_MENU_MARGIN),
		clampf(y, 150.0, 1080.0 - menu_height - LIVE_ACTION_MENU_MARGIN)
	)


func _live_action_label(action: Dictionary) -> String:
	var action_type := str(action.get("type", "Action"))
	var label := action_type.replace("_", " ").capitalize()
	if action_type == "Attack":
		label = str(action.get("abilityId", "Attack")).replace("_", " ").capitalize()
	elif action_type == "PassTurn":
		label = "Pass turn"
	var target_id := str(action.get("targetId", ""))
	if not target_id.is_empty():
		label += "  /  %s" % _live_combatant_name(target_id)
	return label


func _live_combatant_name(combatant_id: String) -> String:
	var combatants := live_current_state.get("combatants", []) as Array
	for combatant_value: Variant in combatants:
		if typeof(combatant_value) != TYPE_DICTIONARY:
			continue
		var combatant := combatant_value as Dictionary
		if str(combatant.get("id", "")) == combatant_id:
			return str(combatant.get("displayName", combatant_id))
	return combatant_id.replace("_", " ").capitalize()


func _bind_compositor_renderers() -> void:
	for layer_index in range(7):
		world_layers[layer_index].call("bind_controller", self)
	post_composite.call("bind_controller", self)
	ui_renderer.call("bind_controller", self)
	diagnostic_overlay.call("bind_controller", self)


func _refresh_all_compositor_layers() -> void:
	for layer in world_layers:
		layer.call("refresh")
	ui_renderer.call("refresh")
	diagnostic_overlay.call("refresh")


func _refresh_dynamic_compositor_layers() -> void:
	if opening_mode:
		for layer in world_layers:
			layer.call("refresh")
	else:
		for layer_index in [3, 4, 5]:
			world_layers[layer_index].call("refresh")
	post_composite.call("refresh")
	ui_renderer.call("refresh")
	diagnostic_overlay.call("refresh")


func _toggle_compositor_layer(layer_index: int) -> void:
	if layer_index < 0 or layer_index >= layer_visibility.size():
		return
	_set_compositor_layer_visible(layer_index, not layer_visibility[layer_index])
	print(
		"[Godot Compositor] Layer %02d %s -> %s"
		% [
			layer_index + 1,
			EXPECTED_LAYER_NAMES[layer_index],
			"ON" if layer_visibility[layer_index] else "OFF",
		]
	)


func _restore_compositor_layers() -> void:
	for layer_index in range(layer_visibility.size()):
		_set_compositor_layer_visible(layer_index, true)
	print("[Godot Compositor] Restored all nine layers.")


func _set_compositor_layer_visible(layer_index: int, is_visible: bool) -> void:
	layer_visibility[layer_index] = is_visible
	if layer_index < 7:
		world_layers[layer_index].visible = is_visible
	elif layer_index == 7:
		post_composite.call("set_post_enabled", is_visible)
	else:
		ui_layer.visible = is_visible


func _apply_diagnostic_layout() -> void:
	var tile_size := DESIGN_SIZE / 3.0
	var tile_scale := Vector2.ONE / 3.0
	for layer_index in range(7):
		var layer := world_layers[layer_index]
		if diagnostic_compositor:
			layer.position = Vector2(float(layer_index % 3) * tile_size.x, float(layer_index / 3) * tile_size.y)
			layer.scale = tile_scale
		else:
			layer.position = Vector2.ZERO
			layer.scale = Vector2.ONE
	if diagnostic_compositor:
		ui_renderer.position = Vector2(2.0 * tile_size.x, 2.0 * tile_size.y)
		ui_renderer.scale = tile_scale
	else:
		ui_renderer.position = Vector2.ZERO
		ui_renderer.scale = Vector2.ONE
	post_composite.position = Vector2.ZERO
	post_composite.scale = Vector2.ONE
	post_composite.call("set_diagnostic_mode", diagnostic_compositor)
	diagnostic_overlay.visible = diagnostic_compositor
	_refresh_all_compositor_layers()


func _validate_compositor_contract() -> bool:
	var violations: Array[String] = []
	if world_source_viewport.size != HALF_POST_SIZE:
		violations.append("World source viewport must remain exactly 960x540.")
	if world_design_surface.scale != Vector2(0.5, 0.5):
		violations.append("World design surface must scale 1920x1080 presentation commands into 960x540 once.")
	if world_composition.get_child_count() != 7:
		violations.append("WorldComposition must contain exactly seven ordered pre-post layers.")
	for layer_index in range(mini(7, world_composition.get_child_count())):
		var layer_node := world_composition.get_child(layer_index)
		if str(layer_node.name) != EXPECTED_LAYER_NAMES[layer_index]:
			violations.append(
				"Layer %02d node is %s; expected %s."
				% [layer_index + 1, layer_node.name, EXPECTED_LAYER_NAMES[layer_index]]
			)
		if not layer_node.is_in_group("compositor_layer") or not layer_node.is_in_group(EXPECTED_LAYER_GROUPS[layer_index]):
			violations.append("Layer %02d is missing its exact compositor groups." % (layer_index + 1))
		if not (layer_node is Node2D) or (layer_node as Node2D).z_index != layer_index:
			violations.append("Layer %02d z_index must equal %d." % [layer_index + 1, layer_index])
		if not layer_node.has_method("get_layer_number") or int(layer_node.call("get_layer_number")) != layer_index + 1:
			violations.append("Layer %02d renderer number does not match its semantic order." % (layer_index + 1))
	if str(post_composite.name) != EXPECTED_LAYER_NAMES[7]:
		violations.append("Post node must be named %s." % EXPECTED_LAYER_NAMES[7])
	if not post_composite.is_in_group("compositor_layer") or not post_composite.is_in_group(EXPECTED_LAYER_GROUPS[7]):
		violations.append("Layer 08 is missing its exact compositor groups.")
	if post_composite.z_index != 7:
		violations.append("Layer 08 z_index must equal 7.")
	if world_source_viewport.is_ancestor_of(post_composite):
		violations.append("Layer 08 must sample the world viewport as a sibling, not render inside its own source.")
	if str(ui_layer.name) != EXPECTED_LAYER_NAMES[8]:
		violations.append("UI node must be named %s." % EXPECTED_LAYER_NAMES[8])
	if not ui_layer.is_in_group("compositor_layer") or not ui_layer.is_in_group(EXPECTED_LAYER_GROUPS[8]):
		violations.append("Layer 09 is missing its exact compositor groups.")
	if ui_layer.layer <= 7:
		violations.append("UI CanvasLayer must render above every world/post layer.")
	if post_composite.is_ancestor_of(ui_layer):
		violations.append("UI must remain a sibling outside the post-processing subtree.")
	if not ui_renderer.has_method("get_layer_number") or int(ui_renderer.call("get_layer_number")) != 9:
		violations.append("UI renderer must identify as compositor layer 09.")
	if not post_composite.has_method("get_half_resolution_size") or post_composite.call("get_half_resolution_size") != HALF_POST_SIZE:
		violations.append("Post-processing viewport must remain exactly 960x540.")
	if not post_composite.has_method("get_world_source_size") or post_composite.call("get_world_source_size") != HALF_POST_SIZE:
		violations.append("Layer 08 must consume a 960x540 composed-world source.")
	if not post_composite.has_method("get_composite_size") or post_composite.call("get_composite_size") != DESIGN_SIZE:
		violations.append("Layer 08 must enlarge the post result once to 1920x1080.")
	if not post_composite.has_method("get_post_shader_path") or str(post_composite.call("get_post_shader_path")) != POST_SHADER_PATH:
		violations.append("Layer 08 must use the canonical full-scene post shader.")
	if not post_composite.has_method("has_true_world_feed") or not bool(post_composite.call("has_true_world_feed")):
		violations.append("Layer 08 is not sampling the actual composed Layers01-07 viewport.")
	if not violations.is_empty():
		for violation in violations:
			push_error("Canonical compositor contract violation: %s" % violation)
		return false
	print(
		"[Godot Compositor] PASS order=01>02>03>04>05>06>07>08>09 world_feed=960x540 post=960x540 upscale=1920x1080 ui=CanvasLayer100/outside-post."
	)
	return true


func _current_frame_index() -> int:
	var current := 0
	for index in frames.size():
		var frame := frames[index] as Dictionary
		if playback_seconds >= float(frame.get("atSeconds", 0.0)):
			current = index
		else:
			break
	return current


func _action_progress(frame: Dictionary) -> float:
	if frame.get("action") == null:
		return 1.0
	var action := frame.get("action", {}) as Dictionary
	var timing := action.get("timing", {}) as Dictionary
	var duration := float(timing.get("durationSeconds", 0.3))
	return clampf(_action_elapsed(frame) / maxf(duration, 0.001), 0.0, 1.0)


func _action_elapsed(frame: Dictionary) -> float:
	return maxf(0.0, playback_seconds - float(frame.get("atSeconds", 0.0)))


func _visible_state(frame_index: int, frame: Dictionary, action: Dictionary, elapsed: float) -> Dictionary:
	var result_state := frame.get("state", {}) as Dictionary
	if frame_index == 0 or action.is_empty():
		return result_state
	var result_anchor := _action_result_anchor(action)
	if elapsed >= result_anchor:
		return result_state
	var previous_frame := frames[frame_index - 1] as Dictionary
	return previous_frame.get("state", {}) as Dictionary


func _action_result_anchor(action: Dictionary) -> float:
	var timing := action.get("timing", {}) as Dictionary
	var contact_value: Variant = timing.get("visualContactSeconds")
	return (
		float(contact_value)
		if contact_value != null
		else float(timing.get("durationSeconds", 0.3))
	)


func _validate_contact_gated_reveal() -> bool:
	for index in range(1, frames.size()):
		var frame := frames[index] as Dictionary
		var action := frame.get("action", {}) as Dictionary
		var anchor := _action_result_anchor(action)
		var result_state := frame.get("state", {}) as Dictionary
		var previous_state := (frames[index - 1] as Dictionary).get("state", {}) as Dictionary
		if anchor > 0.0 and _visible_state(index, frame, action, anchor * 0.5) != previous_state:
			push_error("Snapshot reveal validation failed before frame %d result anchor." % index)
			return false
		if _visible_state(index, frame, action, anchor) != result_state:
			push_error("Snapshot reveal validation failed at frame %d result anchor." % index)
			return false
	print("[Godot Presentation] PASS contact-gated snapshot reveal for %d transitions." % maxi(0, frames.size() - 1))
	return true


func _build_deterministic_particles() -> void:
	var source := bridge.get("source", {}) as Dictionary
	var rng := RandomNumberGenerator.new()
	rng.seed = int(source.get("seed", 0))
	for _index in 52:
		ambient_particles.append({
			"x": rng.randf_range(60.0, 1860.0),
			"y": rng.randf_range(100.0, 800.0),
			"radius": rng.randf_range(1.0, 3.0),
			"phase": rng.randf_range(0.0, TAU),
			"speed": rng.randf_range(0.07, 0.22)
		})


func _unit_positions(state: Dictionary, action: Dictionary, progress: float) -> Dictionary:
	var positions := {}
	var combatants := state.get("combatants", []) as Array
	for item in combatants:
		var combatant := item as Dictionary
		var slot := int(combatant.get("slot", 0))
		var side := str(combatant.get("side", "enemy"))
		var formation := PARTY_FORMATION if side == "party" else ENEMY_FORMATION
		var fallback := Vector2(1608.0 - slot * 178.0, 910.0 - slot * 45.0) if side == "party" else Vector2(500.0 + slot * 110.0, 880.0)
		positions[str(combatant.get("id", ""))] = formation[slot] if slot >= 0 and slot < formation.size() else fallback

	if not action.is_empty() and progress < 1.0:
		var actor_id := str(action.get("actorId", ""))
		var target_id := str(action.get("targetId", ""))
		if positions.has(actor_id) and positions.has(target_id):
			var action_type := str(action.get("type", ""))
			var category := str(action.get("abilityCategory", ""))
			if action_type == "advance" or (action_type == "attack" and category == "melee"):
				var actor_position := positions[actor_id] as Vector2
				var target_position := positions[target_id] as Vector2
				var distance := 76.0 if action_type == "attack" else 42.0
				positions[actor_id] = actor_position + actor_position.direction_to(target_position) * sin(progress * PI) * distance
	return positions
