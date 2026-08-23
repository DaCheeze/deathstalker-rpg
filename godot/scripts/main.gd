extends Node2D

const BridgeLoader = preload("res://scripts/presentation_bridge_loader.gd")
const CombatAudio = preload("res://scripts/procedural_combat_audio.gd")
const LicensedCueBank = preload("res://scripts/audio/licensed_cue_bank.gd")
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


func _ready() -> void:
	if not _select_fixture_from_user_args() or not _select_audio_mode_from_user_args():
		set_process(false)
		get_tree().quit(1)
		return
	if not _validate_compositor_contract():
		set_process(false)
		get_tree().quit(1)
		return
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
	smoke_mode = OS.get_cmdline_user_args().has("--bridge-smoke")
	diagnostic_compositor = OS.get_cmdline_user_args().has("--diagnostic")
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
	print(
		"[Godot Presentation] Loaded fixture=%s with %d validated TypeScript snapshots (schema v%d); result state is contact-gated and no combat logic is executed."
		% [fixture_name, frames.size(), int(bridge.get("schemaVersion", 0))]
	)
	_refresh_all_compositor_layers()


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


func _unhandled_input(event: InputEvent) -> void:
	if not event is InputEventKey or not event.pressed:
		return
	var handled := true
	if event.keycode >= KEY_F1 and event.keycode <= KEY_F9:
		_toggle_compositor_layer(int(event.keycode) - int(KEY_F1))
	else:
		match event.keycode:
			KEY_SPACE:
				paused = not paused
			KEY_R:
				_restart_replay()
			KEY_TAB:
				show_overlay = not show_overlay
			KEY_D:
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
		"frame_samples": frame_samples,
		"layer_visibility": layer_visibility,
		"diagnostic_compositor": diagnostic_compositor,
	}


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
		var x := 1580.0 - slot * 180.0 if side == "party" else 340.0 + slot * 220.0
		var y := 775.0 + float(slot % 2) * 22.0
		positions[str(combatant.get("id", ""))] = Vector2(x, y)

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
