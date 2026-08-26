class_name ProceduralCombatAudio
extends Node

signal cue_started(
	cue_id: StringName,
	display_name: String,
	variation_index: int,
	duration_seconds: float,
	contacts: PackedFloat32Array
)
signal mute_changed(muted: bool)

const MIX_RATE := 48000.0
const OUTPUT_GAIN := 0.72
const GENERATOR_BUFFER_SECONDS := 0.35
const SEQUENCE_GAP_SECONDS := 0.24
const DEFAULT_OUTPUT_DB := -6.0
const MELEE_CONTACT_SECONDS := 0.100
const DAGGER_FIRST_CONTACT_SECONDS := 0.085
const DAGGER_SECOND_CONTACT_SECONDS := 0.145
const DAGGER_MAX_PEAK := 0.52
const DAGGER_SECOND_CONTACT_MIN_RATIO := 1.20
const DISRUPTOR_BEAM_SECONDS := 0.220
const DISRUPTOR_CONTACT_SECONDS := 0.460
const DISRUPTOR_DURATION_SECONDS := 0.540
const DISRUPTOR_MAX_PEAK := 0.32
const DISRUPTOR_MAX_DELTA_RMS := 0.018
const SHIELD_LOCK_SECONDS := 0.240
const SHIELD_DURATION_SECONDS := 0.370
const SHIELD_MAX_PEAK := 0.28
const PSIONIC_CONTACT_SECONDS := 0.320
const PSIONIC_DURATION_SECONDS := 0.455
const PSIONIC_MAX_PEAK := 0.30
const PSIONIC_MAX_DELTA_RMS := 0.016
const NEW_FAMILY_STACK_MAX_PEAK := 0.64
const NEW_FAMILY_STACK_MAX_RMS := 0.10

const RANGED_CUE_IDS: Array[StringName] = [
	&"particle",
	&"ballistic_scatter",
	&"plasma",
]

const CUE_IDS: Array[StringName] = [
	&"vibro_blade",
	&"twin_vibro_daggers",
	&"heavy_smash",
	&"concussive_shove",
	&"disruptor",
	&"shield_raise",
	&"psionic",
	&"particle",
	&"ballistic_scatter",
	&"plasma",
]

const CUE_DURATIONS := {
	&"vibro_blade": 0.30,
	&"twin_vibro_daggers": 0.225,
	&"heavy_smash": 0.34,
	&"concussive_shove": 0.29,
	&"disruptor": DISRUPTOR_DURATION_SECONDS,
	&"shield_raise": SHIELD_DURATION_SECONDS,
	&"psionic": PSIONIC_DURATION_SECONDS,
	&"particle": 0.320,
	&"ballistic_scatter": 0.300,
	&"plasma": 0.345,
}

const CUE_CONTACTS := {
	&"vibro_blade": [MELEE_CONTACT_SECONDS],
	&"twin_vibro_daggers": [DAGGER_FIRST_CONTACT_SECONDS, DAGGER_SECOND_CONTACT_SECONDS],
	&"heavy_smash": [MELEE_CONTACT_SECONDS],
	&"concussive_shove": [MELEE_CONTACT_SECONDS],
	&"disruptor": [DISRUPTOR_CONTACT_SECONDS],
	&"shield_raise": [SHIELD_LOCK_SECONDS],
	&"psionic": [PSIONIC_CONTACT_SECONDS],
	&"particle": [0.250],
	&"ballistic_scatter": [0.210],
	&"plasma": [0.250],
}

const CUE_NAMES := {
	&"vibro_blade": "VIBRO-BLADE",
	&"twin_vibro_daggers": "TWIN VIBRO-DAGGERS",
	&"heavy_smash": "HEAVY SMASH",
	&"concussive_shove": "CONCUSSIVE SHOVE",
	&"disruptor": "DISRUPTOR",
	&"shield_raise": "FORCE SHIELD",
	&"psionic": "PSIONICS",
	&"particle": "PARTICLE CARBINE",
	&"ballistic_scatter": "SCATTER SHOT",
	&"plasma": "PLASMA BURST",
}

const CUE_SEEDS := {
	&"vibro_blade": 0x17A31,
	&"twin_vibro_daggers": 0x2D449,
	&"heavy_smash": 0x38C57,
	&"concussive_shove": 0x4B66D,
	&"disruptor": 0x5C87B,
	&"shield_raise": 0x6DA91,
	&"psionic": 0x7EBB3,
}

# x = pitch, y = filter, z = decay. This mirrors the browser route's bounded
# six-step family while leaving every semantic contact sample unchanged.
const VARIATIONS: Array[Vector3] = [
	Vector3(1.000, 1.00, 1.00),
	Vector3(0.982, 1.04, 1.02),
	Vector3(1.014, 0.95, 0.98),
	Vector3(0.993, 1.06, 1.01),
	Vector3(1.018, 0.97, 0.97),
	Vector3(0.987, 1.02, 1.03),
]

const AUDIO_MODE_AUTO := "auto"
const AUDIO_MODE_PROCEDURAL := "procedural"
const AUDIO_MODE_LICENSED := "licensed"
const AUDIO_MODES: Array[String] = [
	AUDIO_MODE_AUTO,
	AUDIO_MODE_PROCEDURAL,
	AUDIO_MODE_LICENSED,
]

var _player: AudioStreamPlayer
var _playback: AudioStreamGeneratorPlayback
var _pending_samples := PackedVector2Array()
var _pending_cursor := 0
var _variation_sequence := 0
var _muted := false
var _output_suppressed := false
var _output_db := DEFAULT_OUTPUT_DB
var _playback_end_msec := 0
var _ranged_bank: RefCounted
var _licensed_bank: Node
var _audio_mode := AUDIO_MODE_PROCEDURAL

func _ready() -> void:
	_ensure_player()


func _ensure_player() -> void:
	if _output_suppressed or _player != null:
		return
	var generator := AudioStreamGenerator.new()
	generator.mix_rate = MIX_RATE
	generator.buffer_length = GENERATOR_BUFFER_SECONDS

	_player = AudioStreamPlayer.new()
	_player.name = "NativeProceduralOutput"
	_player.playback_type = AudioServer.PLAYBACK_TYPE_STREAM
	_player.stream = generator
	add_child(_player)
	_apply_output_level()

func _process(_delta: float) -> void:
	_pump_generator()
	if _playback_end_msec > 0 and Time.get_ticks_msec() >= _playback_end_msec:
		_player.stop()
		_playback = null
		_playback_end_msec = 0

func supports_cue(cue_id: StringName) -> bool:
	return CUE_IDS.has(cue_id)


func install_ranged_bank(bank: RefCounted) -> bool:
	if bank == null or not bank.has_method("render_cue") or not bank.has_method("supports_cue"):
		push_error("Combat audio received an invalid ranged cue bank.")
		return false
	for cue_id in RANGED_CUE_IDS:
		if not bool(bank.call("supports_cue", cue_id)):
			push_error("Ranged cue bank does not support canonical cue: %s" % cue_id)
			return false
	_ranged_bank = bank
	return true


func install_licensed_bank(bank: Node) -> bool:
	if (
		bank == null
		or not bank.has_method("state")
		or not bank.has_method("is_valid")
		or not bank.has_method("is_ready")
		or not bank.has_method("supports_cue")
		or not bank.has_method("play_cue")
		or not bank.has_method("stop")
		or not bank.has_method("shutdown")
		or not bank.has_method("set_muted")
		or not bank.has_method("set_output_db")
		or not bank.has_method("set_output_suppressed")
		or not bank.has_method("has_active_playback")
	):
		push_error("Combat audio received an invalid licensed cue bank.")
		return false
	if _licensed_bank != null and _licensed_bank != bank:
		push_error("Combat audio already has a different licensed cue bank installed.")
		return false
	if bank.get_parent() == null:
		add_child(bank)
	elif bank.get_parent() != self:
		push_error("Licensed cue bank must be unparented or already owned by combat audio.")
		return false
	_licensed_bank = bank
	_licensed_bank.call("set_muted", _muted)
	_licensed_bank.call("set_output_db", _output_db)
	_licensed_bank.call("set_output_suppressed", _output_suppressed)
	return true


func configure_audio_mode(mode: String) -> bool:
	if not AUDIO_MODES.has(mode):
		push_error("Unknown combat audio mode '%s'; expected auto, procedural, or licensed." % mode)
		return false
	if mode == AUDIO_MODE_PROCEDURAL:
		_audio_mode = mode
		return true
	if _licensed_bank == null:
		if mode == AUDIO_MODE_AUTO:
			_audio_mode = mode
			return true
		push_error("Licensed combat audio mode requires an installed licensed cue bank.")
		return false
	if not bool(_licensed_bank.call("is_valid")):
		push_error(
			"Licensed combat audio bank is invalid (state=%s)."
			% str(_licensed_bank.call("state"))
		)
		return false
	if mode == AUDIO_MODE_LICENSED and not bool(_licensed_bank.call("is_ready")):
		push_error("Licensed combat audio mode requires all staged licensed WAVs.")
		return false
	_audio_mode = mode
	return true


func get_audio_mode() -> String:
	return _audio_mode


func licensed_bank_state() -> StringName:
	if _licensed_bank == null:
		return &"unavailable"
	return _licensed_bank.call("state") as StringName


func play_cue(cue_id: StringName) -> Dictionary:
	if not CUE_IDS.has(cue_id):
		push_error("Unknown combat audio cue: %s" % cue_id)
		return {}

	var sequence := _variation_sequence
	var variation_index := _positive_modulo(sequence, VARIATIONS.size())
	var duration := float(CUE_DURATIONS[cue_id])
	var contacts := _contacts_for(cue_id)
	if _should_use_licensed_cue(cue_id):
		_stop_procedural_playback()
		var licensed_metrics := _licensed_bank.call(
			"play_cue",
			cue_id,
			sequence,
			float(VARIATIONS[variation_index].x)
		) as Dictionary
		if licensed_metrics.is_empty():
			push_error("Licensed combat audio failed to play canonical cue: %s" % cue_id)
			return {}
		if not _licensed_timing_matches(licensed_metrics, duration, contacts):
			_licensed_bank.call("stop")
			push_error("Licensed combat audio timing diverged for canonical cue: %s" % cue_id)
			return {}
		_variation_sequence += 1
		licensed_metrics["licensed_variation_index"] = int(
			licensed_metrics.get("variation_index", -1)
		)
		licensed_metrics["variation_index"] = variation_index
		licensed_metrics["source"] = AUDIO_MODE_LICENSED
		licensed_metrics["generator_ready"] = false
		cue_started.emit(
			cue_id,
			str(CUE_NAMES[cue_id]),
			variation_index,
			duration,
			contacts
		)
		return licensed_metrics

	if _licensed_bank != null:
		_licensed_bank.call("stop")
	var samples := _render_cue(cue_id, sequence)
	_variation_sequence += 1
	_replace_pending(samples)

	cue_started.emit(
		cue_id,
		str(CUE_NAMES[cue_id]),
		variation_index,
		duration,
		contacts
	)
	var metrics := _measure_buffer(samples, contacts)
	metrics["generator_ready"] = _playback != null
	metrics["playback_ready"] = _output_suppressed or _playback != null
	metrics["licensed"] = false
	metrics["source"] = AUDIO_MODE_PROCEDURAL
	return metrics


func audition(cue_id: StringName) -> Dictionary:
	return play_cue(cue_id)

func audition_sequence() -> Dictionary:
	if _licensed_bank != null:
		_licensed_bank.call("stop")
	var combined := PackedVector2Array()
	var absolute_contacts := PackedFloat32Array()
	var cursor_seconds := 0.0
	var first_variation := _positive_modulo(_variation_sequence, VARIATIONS.size())

	for cue_index in CUE_IDS.size():
		var cue_id := CUE_IDS[cue_index]
		var rendered := _render_cue(cue_id, _variation_sequence)
		_variation_sequence += 1
		for contact in _contacts_for(cue_id):
			absolute_contacts.append(cursor_seconds + contact)
		combined.append_array(rendered)
		cursor_seconds += float(CUE_DURATIONS[cue_id])
		if cue_index < CUE_IDS.size() - 1:
			var gap_frames := roundi(SEQUENCE_GAP_SECONDS * MIX_RATE)
			combined.resize(combined.size() + gap_frames)
			cursor_seconds += SEQUENCE_GAP_SECONDS

	_replace_pending(combined)
	cue_started.emit(
		&"sequence",
		"TEN-CUE AUDITION",
		first_variation,
		cursor_seconds,
		absolute_contacts
	)
	return _measure_buffer(combined, absolute_contacts)

func reset_variation_sequence() -> void:
	_variation_sequence = 0
	stop()

func stop() -> void:
	_stop_procedural_playback()
	if _licensed_bank != null:
		_licensed_bank.call("stop")


func _stop_procedural_playback() -> void:
	_pending_samples = PackedVector2Array()
	_pending_cursor = 0
	_playback_end_msec = 0
	if _player != null:
		_player.stop()
	_playback = null

func shutdown() -> void:
	stop()
	if _licensed_bank != null:
		_licensed_bank.call("shutdown")
	if _player != null:
		_player.stream = null
		_player.queue_free()
		_player = null

func toggle_muted() -> bool:
	set_muted(not _muted)
	return _muted

func set_muted(muted: bool) -> void:
	_muted = muted
	_apply_output_level()
	if _licensed_bank != null:
		_licensed_bank.call("set_muted", _muted)
	mute_changed.emit(_muted)

func is_muted() -> bool:
	return _muted

func set_output_db(level_db: float) -> void:
	_output_db = clampf(level_db, -24.0, 0.0)
	_apply_output_level()
	if _licensed_bank != null:
		_licensed_bank.call("set_output_db", _output_db)


func set_output_suppressed(suppressed: bool) -> void:
	_output_suppressed = suppressed
	if not _output_suppressed:
		_ensure_player()
	_apply_output_level()
	if _licensed_bank != null:
		_licensed_bank.call("set_output_suppressed", _output_suppressed)


func is_output_suppressed() -> bool:
	return _output_suppressed


func get_variation_sequence() -> int:
	return _variation_sequence

func get_pending_frame_count() -> int:
	return maxi(0, _pending_samples.size() - _pending_cursor)

func get_generator_skips() -> int:
	if _playback == null:
		return 0
	return _playback.get_skips()


func has_active_playback() -> bool:
	return (
		_playback != null
		or not _pending_samples.is_empty()
		or (
			_licensed_bank != null
			and bool(_licensed_bank.call("has_active_playback"))
		)
	)


func _should_use_licensed_cue(cue_id: StringName) -> bool:
	return (
		_audio_mode != AUDIO_MODE_PROCEDURAL
		and _licensed_bank != null
		and bool(_licensed_bank.call("is_ready"))
		and bool(_licensed_bank.call("supports_cue", cue_id))
	)


func _licensed_timing_matches(
	metrics: Dictionary,
	expected_duration: float,
	expected_contacts: PackedFloat32Array
) -> bool:
	if not is_equal_approx(float(metrics.get("duration_seconds", -1.0)), expected_duration):
		return false
	var contacts_value: Variant = metrics.get("contacts")
	if typeof(contacts_value) != TYPE_PACKED_FLOAT32_ARRAY:
		return false
	var actual_contacts := contacts_value as PackedFloat32Array
	if actual_contacts.size() != expected_contacts.size():
		return false
	for index in expected_contacts.size():
		if not is_equal_approx(actual_contacts[index], expected_contacts[index]):
			return false
	return true

func cue_metadata(cue_id: StringName) -> Dictionary:
	if not CUE_IDS.has(cue_id):
		return {}
	var metadata := {
		"display_name": str(CUE_NAMES[cue_id]),
		"duration_seconds": float(CUE_DURATIONS[cue_id]),
		"contacts": _contacts_for(cue_id),
	}
	if cue_id == &"disruptor":
		metadata["beam_seconds"] = DISRUPTOR_BEAM_SECONDS
	if cue_id == &"shield_raise":
		metadata["lock_seconds"] = SHIELD_LOCK_SECONDS
	return metadata


func _apply_output_level() -> void:
	if _player == null:
		return
	_player.volume_linear = (
		0.0
		if _muted or _output_suppressed
		else db_to_linear(_output_db)
	)

# This checks deterministic in-memory rendering, contact bounds, finite samples,
# and rendered buffer shape. It is not a listening or latency test.
func run_render_smoke_test() -> bool:
	var passed := true
	if VARIATIONS.size() != 6:
		push_error("Combat audio variation cycle must contain exactly six steps.")
		passed = false
	for cue_index in CUE_IDS.size():
		var cue_id := CUE_IDS[cue_index]
		var contacts := _contacts_for(cue_id)
		var expected_frames := roundi(float(CUE_DURATIONS[cue_id]) * MIX_RATE)
		for variation_index in VARIATIONS.size():
			var samples := _render_cue(cue_id, variation_index)
			var repeated_samples := _render_cue(cue_id, variation_index)
			var metrics := _measure_buffer(samples, contacts)

			if not _buffers_match(samples, repeated_samples):
				push_error("%s variation %d did not render deterministically." % [cue_id, variation_index])
				passed = false
			if samples.size() != expected_frames:
				push_error("%s rendered %d frames; expected %d." % [cue_id, samples.size(), expected_frames])
				passed = false
			if not bool(metrics["finite"]) or float(metrics["peak"]) <= 0.01:
				push_error("%s variation %d rendered invalid or silent samples." % [cue_id, variation_index])
				passed = false
			for contact in contacts:
				var contact_frame := roundi(contact * MIX_RATE)
				if contact_frame < 0 or contact_frame >= samples.size():
					push_error("%s contact %.3f s falls outside its buffer." % [cue_id, contact])
					passed = false
			if cue_id == &"twin_vibro_daggers":
				var first_contact_rms := _window_rms(samples, 0.085, 0.115)
				var notch_rms := _window_rms(samples, 0.120, 0.142)
				var second_contact_rms := _window_rms(samples, 0.145, 0.190)
				var allowed_notch_rms := minf(
					minf(first_contact_rms, second_contact_rms) * 0.01,
					0.00001
				)
				if notch_rms > allowed_notch_rms:
					push_error(
						"Twin Vibro-Daggers variation %d notch RMS %.8f exceeds threshold %.8f." % [
							variation_index,
							notch_rms,
							allowed_notch_rms,
						]
					)
					passed = false
				if second_contact_rms < first_contact_rms * DAGGER_SECOND_CONTACT_MIN_RATIO:
					push_error(
						"Twin Vibro-Daggers variation %d second contact RMS %.4f must exceed first %.4f by at least %.2fx." % [
							variation_index,
							second_contact_rms,
							first_contact_rms,
							DAGGER_SECOND_CONTACT_MIN_RATIO,
						]
					)
					passed = false
				if float(metrics["peak"]) > DAGGER_MAX_PEAK:
					push_error(
						"Twin Vibro-Daggers variation %d peak %.4f exceeds ceiling %.4f." % [
							variation_index,
							float(metrics["peak"]),
							DAGGER_MAX_PEAK,
						]
					)
					passed = false
				if variation_index == cue_index:
					print(
						"[Combat Audio Render] DAGGER_NOTCH 120-142ms rms=%.8f first_rms=%.4f second_rms=%.4f" % [
							notch_rms,
							first_contact_rms,
							second_contact_rms,
						]
					)

			if cue_id == &"disruptor":
				var charge_rms := _window_rms(samples, 0.050, 0.190)
				var pre_beam_gap_rms := _window_rms(samples, 0.195, 0.215)
				var beam_rms := _window_rms(samples, DISRUPTOR_BEAM_SECONDS, 0.445)
				var contact_rms := _window_rms(samples, DISRUPTOR_CONTACT_SECONDS, 0.520)
				var delta_rms := _window_delta_rms(samples, 0.0, DISRUPTOR_DURATION_SECONDS)
				if float(metrics["peak"]) > DISRUPTOR_MAX_PEAK:
					push_error(
						"Disruptor variation %d peak %.4f exceeds restrained headroom ceiling %.4f." % [
							variation_index,
							float(metrics["peak"]),
							DISRUPTOR_MAX_PEAK,
						]
					)
					passed = false
				if charge_rms <= 0.0005 or charge_rms >= beam_rms:
					push_error(
						"Disruptor variation %d charge RMS %.5f must be audible but quieter than beam RMS %.5f." % [
							variation_index,
							charge_rms,
							beam_rms,
						]
					)
					passed = false
				if pre_beam_gap_rms > 0.00001:
					push_error(
						"Disruptor variation %d pre-beam gap RMS %.8f is not dry silence." % [
							variation_index,
							pre_beam_gap_rms,
						]
					)
					passed = false
				if beam_rms <= 0.005:
					push_error(
						"Disruptor variation %d beam RMS %.5f is effectively silent." % [
							variation_index,
							beam_rms,
						]
					)
					passed = false
				if contact_rms <= beam_rms:
					push_error(
						"Disruptor variation %d contact RMS %.5f must exceed controlled beam RMS %.5f." % [
							variation_index,
							contact_rms,
							beam_rms,
						]
					)
					passed = false
				if delta_rms > DISRUPTOR_MAX_DELTA_RMS:
					push_error(
						"Disruptor variation %d sample-delta RMS %.5f exceeds limited-high-frequency ceiling %.5f." % [
							variation_index,
							delta_rms,
							DISRUPTOR_MAX_DELTA_RMS,
						]
					)
					passed = false
				print(
					"[Combat Audio Render] DISRUPTOR v%d frames=%d peak=%.4f rms=%.4f charge=%.4f beam=%.4f contact=%.4f delta=%.5f contact_at=%.3f" % [
						variation_index,
						samples.size(),
						float(metrics["peak"]),
						float(metrics["rms"]),
						charge_rms,
						beam_rms,
						contact_rms,
						delta_rms,
						DISRUPTOR_CONTACT_SECONDS,
					]
				)

			if cue_id == &"shield_raise":
				var early_rise_rms := _window_rms(samples, 0.040, 0.090)
				var late_rise_rms := _window_rms(samples, 0.175, 0.220)
				var lock_rms := _window_rms(samples, 0.255, 0.335)
				var rise_delta_rms := _window_delta_rms(samples, 0.070, 0.220)
				var lock_delta_rms := _window_delta_rms(samples, 0.270, 0.335)
				if float(metrics["peak"]) > SHIELD_MAX_PEAK:
					push_error(
						"Shield Raise variation %d peak %.4f exceeds containment ceiling %.4f." % [
							variation_index,
							float(metrics["peak"]),
							SHIELD_MAX_PEAK,
						]
					)
					passed = false
				if early_rise_rms <= 0.0004 or late_rise_rms <= early_rise_rms * 1.20:
					push_error(
						"Shield Raise variation %d must rise from stressed texture %.5f to %.5f." % [
							variation_index,
							early_rise_rms,
							late_rise_rms,
						]
					)
					passed = false
				if lock_rms <= 0.004:
					push_error("Shield Raise variation %d containment lock is inaudible." % variation_index)
					passed = false
				if lock_delta_rms >= rise_delta_rms * 0.70:
					push_error(
						"Shield Raise variation %d lock delta %.5f must settle below stressed rise delta %.5f." % [
							variation_index,
							lock_delta_rms,
							rise_delta_rms,
						]
					)
					passed = false
				print(
					"[Combat Audio Render] SHIELD_RAISE v%d frames=%d peak=%.4f rms=%.4f early=%.4f late=%.4f lock=%.4f rise_delta=%.5f lock_delta=%.5f lock_at=%.3f" % [
						variation_index,
						samples.size(),
						float(metrics["peak"]),
						float(metrics["rms"]),
						early_rise_rms,
						late_rise_rms,
						lock_rms,
						rise_delta_rms,
						lock_delta_rms,
						SHIELD_LOCK_SECONDS,
					]
				)

			if cue_id == &"psionic":
				var gathering_rms := _window_rms(samples, 0.090, 0.285)
				var contact_rms := _window_rms(samples, PSIONIC_CONTACT_SECONDS, 0.410)
				var pressure_mid_rms := _window_mid_rms(samples, 0.100, 0.300)
				var pressure_side_rms := _window_side_rms(samples, 0.100, 0.300)
				var delta_rms := _window_delta_rms(samples, 0.0, PSIONIC_DURATION_SECONDS)
				if float(metrics["peak"]) > PSIONIC_MAX_PEAK:
					push_error(
						"Psionics variation %d peak %.4f exceeds internal-pressure ceiling %.4f." % [
							variation_index,
							float(metrics["peak"]),
							PSIONIC_MAX_PEAK,
						]
					)
					passed = false
				if gathering_rms <= 0.001:
					push_error("Psionics variation %d gathering pressure is inaudible." % variation_index)
					passed = false
				if contact_rms <= gathering_rms * 1.10:
					push_error(
						"Psionics variation %d contact RMS %.5f must exceed gathering pressure %.5f." % [
							variation_index,
							contact_rms,
							gathering_rms,
						]
					)
					passed = false
				if pressure_side_rms <= pressure_mid_rms * 0.12:
					push_error(
						"Psionics variation %d lacks internal phase movement: side %.5f versus mid %.5f." % [
							variation_index,
							pressure_side_rms,
							pressure_mid_rms,
						]
					)
					passed = false
				if delta_rms > PSIONIC_MAX_DELTA_RMS:
					push_error(
						"Psionics variation %d sample-delta RMS %.5f exceeds smooth-pressure ceiling %.5f." % [
							variation_index,
							delta_rms,
							PSIONIC_MAX_DELTA_RMS,
						]
					)
					passed = false
				print(
					"[Combat Audio Render] PSIONIC v%d frames=%d peak=%.4f rms=%.4f gather=%.4f contact=%.4f mid=%.4f side=%.4f delta=%.5f contact_at=%.3f" % [
						variation_index,
						samples.size(),
						float(metrics["peak"]),
						float(metrics["rms"]),
						gathering_rms,
						contact_rms,
						pressure_mid_rms,
						pressure_side_rms,
						delta_rms,
						PSIONIC_CONTACT_SECONDS,
					]
				)

			if variation_index == _positive_modulo(cue_index, VARIATIONS.size()):
				print(
					"[Combat Audio Render] %s frames=%d peak=%.4f rms=%.4f contacts=%s" % [
						CUE_NAMES[cue_id],
						samples.size(),
						float(metrics["peak"]),
						float(metrics["rms"]),
						str(contacts),
					]
				)

	for variation_index in VARIATIONS.size():
		var shield_samples := _render_cue(&"shield_raise", variation_index)
		var psionic_samples := _render_cue(&"psionic", variation_index)
		var heavy_samples := _render_cue(&"heavy_smash", variation_index)
		var new_family_stack := _sum_buffers([shield_samples, psionic_samples])
		var shield_heavy_stack := _sum_buffers([shield_samples, heavy_samples])
		var psionic_heavy_stack := _sum_buffers([psionic_samples, heavy_samples])
		var triple_stack := _sum_buffers([shield_samples, psionic_samples, heavy_samples])
		var stack_metrics: Array[Dictionary] = [
			_measure_buffer(new_family_stack, PackedFloat32Array()),
			_measure_buffer(shield_heavy_stack, PackedFloat32Array()),
			_measure_buffer(psionic_heavy_stack, PackedFloat32Array()),
			_measure_buffer(triple_stack, PackedFloat32Array()),
		]
		var max_stack_peak := 0.0
		var max_stack_rms := 0.0
		for stack_metric in stack_metrics:
			max_stack_peak = maxf(max_stack_peak, float(stack_metric["peak"]))
			max_stack_rms = maxf(max_stack_rms, float(stack_metric["rms"]))
		if max_stack_peak > NEW_FAMILY_STACK_MAX_PEAK:
			push_error(
				"New-family variation %d stack peak %.4f exceeds conservative ceiling %.4f." % [
					variation_index,
					max_stack_peak,
					NEW_FAMILY_STACK_MAX_PEAK,
				]
			)
			passed = false
		if max_stack_rms > NEW_FAMILY_STACK_MAX_RMS:
			push_error(
				"New-family variation %d stack RMS %.4f exceeds conservative ceiling %.4f." % [
					variation_index,
					max_stack_rms,
					NEW_FAMILY_STACK_MAX_RMS,
				]
			)
			passed = false
		print(
			"[Combat Audio Render] NEW_FAMILY_STACK v%d peak=%.4f rms=%.4f ceiling=%.2f/%.2f" % [
				variation_index,
				max_stack_peak,
				max_stack_rms,
				NEW_FAMILY_STACK_MAX_PEAK,
				NEW_FAMILY_STACK_MAX_RMS,
			]
		)

	if passed:
		print("[Combat Audio Render] PASS ten cues x six variations; repeat renders are sample-identical.")
	return passed


func _buffers_match(left: PackedVector2Array, right: PackedVector2Array) -> bool:
	if left.size() != right.size():
		return false
	for index in left.size():
		if left[index] != right[index]:
			return false
	return true

func _pump_generator() -> void:
	if _playback == null or _pending_cursor >= _pending_samples.size():
		return
	var available := _playback.get_frames_available()
	if available <= 0:
		return

	var amount := mini(available, _pending_samples.size() - _pending_cursor)
	amount = mini(amount, 8192)
	var chunk := PackedVector2Array()
	chunk.resize(amount)
	for index in amount:
		chunk[index] = _pending_samples[_pending_cursor + index]
	if _playback.push_buffer(chunk):
		_pending_cursor += amount

func _replace_pending(samples: PackedVector2Array) -> void:
	if _player == null:
		# Headless smoke keeps the rendered PCM as a pending, inaudible queue so
		# restart/wrap can prove the shared stop path clears real buffer state.
		_pending_samples = samples
		_pending_cursor = 0
		_playback_end_msec = 0
		_playback = null
		return
	if _player != null and _player.playing:
		_player.stop()
	_playback = null
	_pending_samples = samples
	_pending_cursor = 0
	_playback_end_msec = Time.get_ticks_msec() + roundi(float(samples.size()) / MIX_RATE * 1000.0) + 120
	if _player != null:
		_player.play()
		_playback = _player.get_stream_playback() as AudioStreamGeneratorPlayback
		if _playback == null:
			push_error("AudioStreamGeneratorPlayback was not created.")
		else:
			_pump_generator()

func _render_cue(cue_id: StringName, sequence: int) -> PackedVector2Array:
	var variation_index := _positive_modulo(sequence, VARIATIONS.size())
	var variation := VARIATIONS[variation_index]
	if RANGED_CUE_IDS.has(cue_id):
		if not _ensure_ranged_bank():
			return PackedVector2Array()
		return _ranged_bank.call("render_cue", cue_id, variation, sequence, MIX_RATE) as PackedVector2Array
	var samples := _empty_buffer(float(CUE_DURATIONS[cue_id]))
	match cue_id:
		&"vibro_blade":
			_render_vibro_blade(samples, variation, sequence)
		&"twin_vibro_daggers":
			_render_twin_vibro_daggers(samples, variation, sequence)
		&"heavy_smash":
			_render_heavy_smash(samples, variation, sequence)
		&"concussive_shove":
			_render_concussive_shove(samples, variation, sequence)
		&"disruptor":
			_render_disruptor(samples, variation, sequence)
		&"shield_raise":
			_render_shield_raise(samples, variation, sequence)
		&"psionic":
			_render_psionic(samples, variation, sequence)
		_:
			push_error("No renderer for cue: %s" % cue_id)
	_finalize_buffer(samples)
	return samples

func _ensure_ranged_bank() -> bool:
	if _ranged_bank != null:
		return true
	var ranged_script := load("res://scripts/audio/ranged_cue_bank.gd") as GDScript
	if ranged_script == null:
		push_error("Canonical ranged cue bank could not be loaded.")
		return false
	return install_ranged_bank(ranged_script.new() as RefCounted)


func _render_vibro_blade(samples: PackedVector2Array, variation: Vector3, sequence: int) -> void:
	# Gesture: a broad 98 ms accelerating air cut, ending before contact.
	_add_band_noise(
		samples,
		_make_rng(&"vibro_blade", sequence, 0),
		0.0,
		0.098 * variation.z,
		900.0 * variation.y,
		4800.0 * variation.y,
		0.052,
		1800.0 * variation.y,
		2.35,
		0.045,
		0.36,
		0.9,
		-0.12,
		0.12
	)

	# Material: a deliberately quiet, imperfect edge-drive residue.
	_add_tone(
		samples,
		0.018,
		0.155 * variation.z,
		138.0 * variation.x,
		178.0 * variation.x,
		0.030,
		0.040,
		1.8,
		&"vibration",
		0.0,
		0.019
	)

	# Consequence: broad steel/body contact begins at the immutable 100 ms anchor.
	_add_lowpass_noise(
		samples,
		_make_rng(&"vibro_blade", sequence, 1),
		MELEE_CONTACT_SECONDS,
		0.13 * variation.z,
		1850.0 * variation.y,
		240.0 * variation.y,
		0.004,
		0.58,
		1.45,
		0.0
	)
	_add_tone(
		samples,
		MELEE_CONTACT_SECONDS,
		0.105 * variation.z,
		1120.0 * variation.x,
		840.0 * variation.x,
		0.003,
		0.052,
		1.7,
		&"unstable_metal",
		0.06,
		0.013
	)

func _render_twin_vibro_daggers(samples: PackedVector2Array, variation: Vector3, sequence: int) -> void:
	# A fast edge sweep resolves into two dry broadband contacts. This borrows the
	# approved local Dagger Hit recipe's timing and impact hierarchy without copying
	# or deriving from its waveform. The silent notch and 60 ms contact separation
	# remain exact; the second hit is broader and stronger.
	_add_band_noise(
		samples,
		_make_rng(&"twin_vibro_daggers", sequence, 0),
		0.0,
		0.078 * variation.z,
		650.0 * variation.y,
		6200.0 * variation.y,
		0.064,
		1800.0 * variation.y,
		2.8,
		0.006,
		0.18,
		0.72,
		-0.62,
		-0.22
	)

	# First cut: compact, dry, and slightly left. The layers begin just before the
	# semantic anchor so their fast attacks peak at 85 ms rather than ringing after it.
	_add_highpass_noise(
		samples,
		_make_rng(&"twin_vibro_daggers", sequence, 1),
		DAGGER_FIRST_CONTACT_SECONDS - 0.003,
		0.028 * variation.z,
		5200.0 * variation.y,
		2500.0 * variation.y,
		0.0025,
		0.40,
		1.8,
		-0.58
	)
	_add_band_noise(
		samples,
		_make_rng(&"twin_vibro_daggers", sequence, 2),
		DAGGER_FIRST_CONTACT_SECONDS - 0.003,
		0.033 * variation.z,
		4000.0 * variation.y,
		7800.0 * variation.y,
		0.003,
		1400.0 * variation.y,
		3.0,
		0.0025,
		0.34,
		1.55,
		-0.64,
		-0.38
	)
	_add_lowpass_noise(
		samples,
		_make_rng(&"twin_vibro_daggers", sequence, 3),
		DAGGER_FIRST_CONTACT_SECONDS,
		0.025 * variation.z,
		2200.0 * variation.y,
		600.0 * variation.y,
		0.0015,
		0.20,
		1.75,
		-0.50
	)

	# Second cut: the approved rhythm's punctuation. It starts at the notch boundary,
	# crosses the stereo field, and carries more broadband body without a tonal ping.
	_add_highpass_noise(
		samples,
		_make_rng(&"twin_vibro_daggers", sequence, 4),
		DAGGER_SECOND_CONTACT_SECONDS - 0.003,
		0.046 * variation.z,
		5900.0 * variation.y,
		2100.0 * variation.y,
		0.003,
		0.48,
		1.55,
		0.56
	)
	_add_band_noise(
		samples,
		_make_rng(&"twin_vibro_daggers", sequence, 5),
		DAGGER_SECOND_CONTACT_SECONDS - 0.003,
		0.050 * variation.z,
		3600.0 * variation.y,
		8600.0 * variation.y,
		0.004,
		1250.0 * variation.y,
		3.2,
		0.003,
		0.42,
		1.35,
		0.34,
		0.68
	)
	_add_lowpass_noise(
		samples,
		_make_rng(&"twin_vibro_daggers", sequence, 6),
		DAGGER_SECOND_CONTACT_SECONDS,
		0.035 * variation.z,
		2600.0 * variation.y,
		520.0 * variation.y,
		0.0015,
		0.25,
		1.55,
		0.52
	)

func _render_heavy_smash(samples: PackedVector2Array, variation: Vector3, sequence: int) -> void:
	# Gesture: displaced low air, not a sword swing.
	_add_lowpass_noise(
		samples,
		_make_rng(&"heavy_smash", sequence, 0),
		0.0,
		0.09 * variation.z,
		520.0 * variation.y,
		220.0 * variation.y,
		0.055,
		0.13,
		1.1,
		0.0
	)

	# Consequence: deck-and-armor body begins at 100 ms. Weight lives mainly in
	# audible 125-300 Hz energy; the sub layer remains supporting material.
	_add_lowpass_noise(
		samples,
		_make_rng(&"heavy_smash", sequence, 1),
		MELEE_CONTACT_SECONDS,
		0.19 * variation.z,
		1450.0 * variation.y,
		150.0 * variation.y,
		0.004,
		0.70,
		1.35,
		0.0
	)
	_add_tone(
		samples,
		MELEE_CONTACT_SECONDS,
		0.19 * variation.z,
		300.0 * variation.x,
		125.0 * variation.x,
		0.004,
		0.35,
		1.45,
		&"dense_body",
		0.0,
		0.0
	)
	_add_tone(
		samples,
		MELEE_CONTACT_SECONDS,
		0.21 * variation.z,
		90.0 * variation.x,
		44.0 * variation.x,
		0.006,
		0.15,
		1.65,
		&"sine",
		0.0,
		0.0
	)

	# Material punctuation: a short stressed-metal scrape after the main body,
	# intentionally aperiodic rather than a sword-like ring.
	_add_highpass_noise(
		samples,
		_make_rng(&"heavy_smash", sequence, 2),
		0.242,
		0.040 * variation.z,
		1250.0 * variation.y,
		2600.0 * variation.y,
		0.003,
		0.105,
		1.55,
		0.08
	)

func _render_concussive_shove(samples: PackedVector2Array, variation: Vector3, sequence: int) -> void:
	# Gesture: compact forward air movement, deliberately smaller than Smash.
	_add_band_noise(
		samples,
		_make_rng(&"concussive_shove", sequence, 0),
		0.045,
		0.053 * variation.z,
		380.0 * variation.y,
		760.0 * variation.y,
		0.032,
		510.0 * variation.y,
		2.4,
		0.025,
		MELEE_CONTACT_SECONDS,
		1.1,
		0.0,
		0.0
	)

	# Contact begins at 100 ms, but has no sub-heavy crush layer.
	_add_band_noise(
		samples,
		_make_rng(&"concussive_shove", sequence, 1),
		MELEE_CONTACT_SECONDS,
		0.060 * variation.z,
		480.0 * variation.y,
		940.0 * variation.y,
		0.014,
		650.0 * variation.y,
		2.25,
		0.004,
		0.72,
		1.45,
		0.0,
		0.0
	)
	_add_tone(
		samples,
		MELEE_CONTACT_SECONDS,
		0.070 * variation.z,
		310.0 * variation.x,
		185.0 * variation.x,
		0.004,
		0.15,
		1.7,
		&"dense_body",
		0.0,
		0.0
	)

	# Consequence: two decorrelated lobes spread outward as queue displacement.
	_add_band_noise(
		samples,
		_make_rng(&"concussive_shove", sequence, 2),
		0.118,
		0.160 * variation.z,
		620.0 * variation.y,
		1180.0 * variation.y,
		0.070,
		2350.0 * variation.y,
		2.8,
		0.050,
		0.20,
		1.05,
		-0.04,
		-0.76
	)
	_add_band_noise(
		samples,
		_make_rng(&"concussive_shove", sequence, 3),
		0.120,
		0.155 * variation.z,
		700.0 * variation.y,
		1320.0 * variation.y,
		0.064,
		2550.0 * variation.y,
		2.7,
		0.046,
		0.18,
		1.12,
		0.04,
		0.76
	)

func _render_disruptor(samples: PackedVector2Array, variation: Vector3, sequence: int) -> void:
	# Charge: a low, quiet readiness cue that ends before the serialized beam
	# anchor. It deliberately avoids the rising high-frequency laser convention.
	_add_tone(
		samples,
		0.050,
		0.140 * variation.z,
		105.0 * variation.x,
		215.0 * variation.x,
		0.105,
		0.032,
		0.72,
		&"dense_body",
		0.0,
		0.010
	)
	_add_lowpass_noise(
		samples,
		_make_rng(&"disruptor", sequence, 0),
		0.065,
		0.125 * variation.z,
		260.0 * variation.y,
		620.0 * variation.y,
		0.090,
		0.024,
		0.75,
		0.0
	)
	_append_disruptor_beam_and_contact(samples, variation, sequence)


func _render_shield_raise(samples: PackedVector2Array, variation: Vector3, sequence: int) -> void:
	# Gesture/material: stressed electrical texture rises without an attack
	# transient, alarm pulse, or weapon crack. The texture folds inward as the
	# containment field reaches its fixed lock boundary.
	_add_shield_electrical_rise(
		samples,
		_make_rng(&"shield_raise", sequence, 0),
		variation
	)

	# Consequence: one centered containment lock settles into a stable fundamental.
	# Harmonic reinforcement is deliberately quiet and never becomes a chord.
	_add_shield_containment_lock(samples, variation)


func _render_psionic(samples: PackedVector2Array, variation: Vector3, sequence: int) -> void:
	# Gesture/material: smooth mid/side pressure moves inside the stereo field.
	# There is no projectile sweep, electrical crack, or pitched weapon onset.
	_add_psionic_phase_pressure(
		samples,
		_make_rng(&"psionic", sequence, 0),
		variation
	)

	# Consequence: the immutable 320 ms semantic contact releases diffuse pressure
	# across the stereo field rather than striking like a physical impact.
	_add_psionic_pressure_release(
		samples,
		_make_rng(&"psionic", sequence, 1),
		variation
	)


func _add_shield_electrical_rise(
	samples: PackedVector2Array,
	rng: RandomNumberGenerator,
	variation: Vector3
) -> void:
	var start_seconds := 0.018
	var duration_seconds := SHIELD_LOCK_SECONDS - start_seconds + 0.006
	var start_frame := roundi(start_seconds * MIX_RATE)
	var frame_count := mini(roundi(duration_seconds * MIX_RATE), samples.size() - start_frame)
	var upper_state := 0.0
	var lower_state := 0.0
	for local_index in frame_count:
		var elapsed := float(local_index) / MIX_RATE
		var progress := float(local_index) / maxf(1.0, float(frame_count - 1))
		var center := _exp_lerp(520.0 * variation.y, 2850.0 * variation.y, progress)
		var upper_cutoff := minf(center * 1.85, MIX_RATE * 0.42)
		var lower_cutoff := maxf(center / 2.8, 80.0)
		var raw := rng.randf_range(-1.0, 1.0)
		var upper_alpha := 1.0 - exp(-TAU * upper_cutoff / MIX_RATE)
		var lower_alpha := 1.0 - exp(-TAU * lower_cutoff / MIX_RATE)
		upper_state += upper_alpha * (raw - upper_state)
		lower_state += lower_alpha * (raw - lower_state)
		var band := (upper_state - lower_state) * 1.65
		var rising := pow(sin(minf(progress / 0.90, 1.0) * PI * 0.5), 1.25)
		var resolving := 1.0 - smoothstep(0.90, 1.0, progress)
		var stress := 0.76 + 0.24 * absf(sin(elapsed * TAU * (27.0 * variation.x)))
		var pan := sin(elapsed * TAU * 2.4) * 0.20
		_mix_mono(
			samples,
			start_frame + local_index,
			band * rising * resolving * stress * 0.225,
			pan
		)


func _add_shield_containment_lock(samples: PackedVector2Array, variation: Vector3) -> void:
	var duration_seconds := minf(
		0.125 * variation.z,
		SHIELD_DURATION_SECONDS - SHIELD_LOCK_SECONDS
	)
	var start_frame := roundi(SHIELD_LOCK_SECONDS * MIX_RATE)
	var frame_count := mini(roundi(duration_seconds * MIX_RATE), samples.size() - start_frame)
	var phase := 0.0
	for local_index in frame_count:
		var elapsed := float(local_index) / MIX_RATE
		var progress := float(local_index) / maxf(1.0, float(frame_count - 1))
		var settle := smoothstep(0.0, minf(1.0, 0.028 / duration_seconds), progress)
		var frequency := lerpf(278.0, 188.0, settle) * variation.x
		phase = fmod(phase + TAU * frequency / MIX_RATE, TAU)
		var attack := smoothstep(0.0, 0.008, elapsed)
		var release := 1.0 - smoothstep(0.78, 1.0, progress)
		var stable_body := sin(phase) + 0.11 * sin(phase * 2.0)
		_mix_mono(
			samples,
			start_frame + local_index,
			stable_body * attack * release * 0.225,
			0.0
		)


func _add_psionic_phase_pressure(
	samples: PackedVector2Array,
	rng: RandomNumberGenerator,
	variation: Vector3
) -> void:
	var start_seconds := 0.025
	var duration_seconds := PSIONIC_CONTACT_SECONDS - start_seconds
	var start_frame := roundi(start_seconds * MIX_RATE)
	var frame_count := mini(roundi(duration_seconds * MIX_RATE), samples.size() - start_frame)
	var mid_upper_state := 0.0
	var mid_lower_state := 0.0
	var side_state := 0.0
	for local_index in frame_count:
		var elapsed := float(local_index) / MIX_RATE
		var progress := float(local_index) / maxf(1.0, float(frame_count - 1))
		var upper_cutoff := _exp_lerp(360.0 * variation.y, 1050.0 * variation.y, progress)
		var lower_cutoff := _exp_lerp(72.0 * variation.y, 145.0 * variation.y, progress)
		var mid_raw := rng.randf_range(-1.0, 1.0)
		var side_raw := rng.randf_range(-1.0, 1.0)
		var upper_alpha := 1.0 - exp(-TAU * upper_cutoff / MIX_RATE)
		var lower_alpha := 1.0 - exp(-TAU * lower_cutoff / MIX_RATE)
		var side_alpha := 1.0 - exp(-TAU * (520.0 * variation.y) / MIX_RATE)
		mid_upper_state += upper_alpha * (mid_raw - mid_upper_state)
		mid_lower_state += lower_alpha * (mid_raw - mid_lower_state)
		side_state += side_alpha * (side_raw - side_state)
		var mid := (mid_upper_state - mid_lower_state) * 1.85
		var rotation := sin(elapsed * TAU * (1.65 * variation.x) + 0.35)
		var side := side_state * rotation * 0.62
		var gathering := pow(smoothstep(0.0, 0.90, progress), 1.15)
		var boundary_taper := 1.0 - smoothstep(0.94, 1.0, progress)
		var breathing := 0.82 + 0.18 * sin(elapsed * TAU * 3.1 + 0.8)
		var envelope := gathering * boundary_taper * breathing * 0.155
		_mix_stereo(
			samples,
			start_frame + local_index,
			(mid + side) * envelope,
			(mid - side) * envelope
		)


func _add_psionic_pressure_release(
	samples: PackedVector2Array,
	rng: RandomNumberGenerator,
	variation: Vector3
) -> void:
	var duration_seconds := PSIONIC_DURATION_SECONDS - PSIONIC_CONTACT_SECONDS
	var start_frame := roundi(PSIONIC_CONTACT_SECONDS * MIX_RATE)
	var frame_count := mini(roundi(duration_seconds * MIX_RATE), samples.size() - start_frame)
	var mid_state := 0.0
	var side_state := 0.0
	for local_index in frame_count:
		var elapsed := float(local_index) / MIX_RATE
		var progress := float(local_index) / maxf(1.0, float(frame_count - 1))
		var cutoff := _exp_lerp(1150.0 * variation.y, 135.0 * variation.y, progress)
		var side_cutoff := _exp_lerp(780.0 * variation.y, 95.0 * variation.y, progress)
		var mid_alpha := 1.0 - exp(-TAU * cutoff / MIX_RATE)
		var side_alpha := 1.0 - exp(-TAU * side_cutoff / MIX_RATE)
		mid_state += mid_alpha * (rng.randf_range(-1.0, 1.0) - mid_state)
		side_state += side_alpha * (rng.randf_range(-1.0, 1.0) - side_state)
		var envelope := _attack_decay_envelope(
			elapsed,
			duration_seconds,
			0.010,
			1.28 / variation.z
		)
		var spread := lerpf(0.12, 0.72, smoothstep(0.0, 0.58, progress))
		var mid := mid_state * 2.05
		var side := side_state * spread * 1.35
		_mix_stereo(
			samples,
			start_frame + local_index,
			(mid + side) * envelope * 0.235,
			(mid - side) * envelope * 0.235
		)


func _append_disruptor_beam_and_contact(
	samples: PackedVector2Array,
	variation: Vector3,
	sequence: int
) -> void:

	# Beam/body: centered and controlled from the immutable 220 ms anchor to
	# just before contact. Its highest noise band remains below roughly 1.8 kHz.
	_add_tone(
		samples,
		DISRUPTOR_BEAM_SECONDS,
		0.225,
		460.0 * variation.x,
		235.0 * variation.x,
		0.006,
		0.075,
		0.62,
		&"vibration",
		0.0,
		0.008
	)
	_add_band_noise(
		samples,
		_make_rng(&"disruptor", sequence, 1),
		DISRUPTOR_BEAM_SECONDS,
		0.225,
		390.0 * variation.y,
		940.0 * variation.y,
		0.050,
		360.0 * variation.y,
		1.80,
		0.008,
		0.068,
		0.80,
		0.0,
		0.0
	)

	# Contact: one compact low-mid body at 460 ms, with no explosion tail,
	# shriek, or fallback weapon layer.
	_add_lowpass_noise(
		samples,
		_make_rng(&"disruptor", sequence, 2),
		DISRUPTOR_CONTACT_SECONDS,
		0.060 * variation.z,
		920.0 * variation.y,
		180.0 * variation.y,
		0.003,
		0.225,
		1.70,
		0.0
	)
	_add_tone(
		samples,
		DISRUPTOR_CONTACT_SECONDS,
		0.070 * variation.z,
		250.0 * variation.x,
		118.0 * variation.x,
		0.003,
		0.160,
		1.65,
		&"dense_body",
		0.0,
		0.0
	)

func _empty_buffer(duration_seconds: float) -> PackedVector2Array:
	var samples := PackedVector2Array()
	samples.resize(roundi(duration_seconds * MIX_RATE))
	return samples

func _make_rng(cue_id: StringName, sequence: int, lane: int) -> RandomNumberGenerator:
	var rng := RandomNumberGenerator.new()
	var base_seed := int(CUE_SEEDS[cue_id])
	rng.seed = base_seed + sequence * 104729 + lane * 13007
	return rng

func _contacts_for(cue_id: StringName) -> PackedFloat32Array:
	return PackedFloat32Array(CUE_CONTACTS[cue_id])

func _add_band_noise(
	samples: PackedVector2Array,
	rng: RandomNumberGenerator,
	start_seconds: float,
	duration_seconds: float,
	start_frequency: float,
	peak_frequency: float,
	peak_time_seconds: float,
	end_frequency: float,
	bandwidth: float,
	attack_seconds: float,
	peak_gain: float,
	decay_power: float,
	pan_start: float,
	pan_end: float
) -> void:
	var start_frame := roundi(start_seconds * MIX_RATE)
	var frame_count := mini(roundi(duration_seconds * MIX_RATE), samples.size() - start_frame)
	if frame_count <= 0:
		return
	var upper_state := 0.0
	var lower_state := 0.0
	var peak_ratio := clampf(peak_time_seconds / maxf(duration_seconds, 0.0001), 0.0, 1.0)

	for local_index in frame_count:
		var elapsed := float(local_index) / MIX_RATE
		var progress := float(local_index) / maxf(1.0, float(frame_count - 1))
		var center := _three_point_frequency(
			start_frequency,
			peak_frequency,
			end_frequency,
			peak_ratio,
			progress
		)
		var upper_cutoff := minf(center * bandwidth, MIX_RATE * 0.44)
		var lower_cutoff := maxf(center / bandwidth, 20.0)
		var raw := rng.randf_range(-1.0, 1.0)
		var upper_alpha := 1.0 - exp(-TAU * upper_cutoff / MIX_RATE)
		var lower_alpha := 1.0 - exp(-TAU * lower_cutoff / MIX_RATE)
		upper_state += upper_alpha * (raw - upper_state)
		lower_state += lower_alpha * (raw - lower_state)
		var band := (upper_state - lower_state) * 1.75
		var envelope := _attack_decay_envelope(elapsed, duration_seconds, attack_seconds, decay_power)
		_mix_mono(
			samples,
			start_frame + local_index,
			band * envelope * peak_gain,
			lerpf(pan_start, pan_end, progress)
		)

func _add_lowpass_noise(
	samples: PackedVector2Array,
	rng: RandomNumberGenerator,
	start_seconds: float,
	duration_seconds: float,
	start_cutoff: float,
	end_cutoff: float,
	attack_seconds: float,
	peak_gain: float,
	decay_power: float,
	pan: float
) -> void:
	var start_frame := roundi(start_seconds * MIX_RATE)
	var frame_count := mini(roundi(duration_seconds * MIX_RATE), samples.size() - start_frame)
	if frame_count <= 0:
		return
	var state := 0.0
	for local_index in frame_count:
		var elapsed := float(local_index) / MIX_RATE
		var progress := float(local_index) / maxf(1.0, float(frame_count - 1))
		var cutoff := _exp_lerp(start_cutoff, end_cutoff, progress)
		var alpha := 1.0 - exp(-TAU * cutoff / MIX_RATE)
		var raw := rng.randf_range(-1.0, 1.0)
		state += alpha * (raw - state)
		var envelope := _attack_decay_envelope(elapsed, duration_seconds, attack_seconds, decay_power)
		_mix_mono(samples, start_frame + local_index, state * 2.0 * envelope * peak_gain, pan)

func _add_highpass_noise(
	samples: PackedVector2Array,
	rng: RandomNumberGenerator,
	start_seconds: float,
	duration_seconds: float,
	start_cutoff: float,
	end_cutoff: float,
	attack_seconds: float,
	peak_gain: float,
	decay_power: float,
	pan: float
) -> void:
	var start_frame := roundi(start_seconds * MIX_RATE)
	var frame_count := mini(roundi(duration_seconds * MIX_RATE), samples.size() - start_frame)
	if frame_count <= 0:
		return
	var low_state := 0.0
	for local_index in frame_count:
		var elapsed := float(local_index) / MIX_RATE
		var progress := float(local_index) / maxf(1.0, float(frame_count - 1))
		var cutoff := _exp_lerp(start_cutoff, end_cutoff, progress)
		var alpha := 1.0 - exp(-TAU * cutoff / MIX_RATE)
		var raw := rng.randf_range(-1.0, 1.0)
		low_state += alpha * (raw - low_state)
		var high := (raw - low_state) * 0.72
		var envelope := _attack_decay_envelope(elapsed, duration_seconds, attack_seconds, decay_power)
		_mix_mono(samples, start_frame + local_index, high * envelope * peak_gain, pan)

func _add_tone(
	samples: PackedVector2Array,
	start_seconds: float,
	duration_seconds: float,
	start_frequency: float,
	end_frequency: float,
	attack_seconds: float,
	peak_gain: float,
	decay_power: float,
	waveform: StringName,
	pan: float,
	wobble_depth: float
) -> void:
	var start_frame := roundi(start_seconds * MIX_RATE)
	var frame_count := mini(roundi(duration_seconds * MIX_RATE), samples.size() - start_frame)
	if frame_count <= 0:
		return
	var phase := 0.0
	for local_index in frame_count:
		var elapsed := float(local_index) / MIX_RATE
		var progress := float(local_index) / maxf(1.0, float(frame_count - 1))
		var wobble := 1.0 + sin(elapsed * TAU * 17.0) * wobble_depth
		var frequency := _exp_lerp(start_frequency, end_frequency, progress) * wobble
		phase = fmod(phase + TAU * frequency / MIX_RATE, TAU)
		var value := _waveform_sample(waveform, phase, elapsed)
		var envelope := _attack_decay_envelope(elapsed, duration_seconds, attack_seconds, decay_power)
		_mix_mono(samples, start_frame + local_index, value * envelope * peak_gain, pan)

func _waveform_sample(waveform: StringName, phase: float, elapsed: float) -> float:
	match waveform:
		&"sine":
			return sin(phase)
		&"dense_body":
			return sin(phase) + 0.24 * sin(phase * 2.03)
		&"vibration":
			return sin(phase) + 0.18 * sin(phase * 2.13 + 0.7)
		&"unstable_metal":
			return sin(phase) * 0.72 + sin(phase * 1.319 + elapsed * 23.0) * 0.28
		_:
			return sin(phase)

func _mix_mono(samples: PackedVector2Array, index: int, value: float, pan: float) -> void:
	if index < 0 or index >= samples.size():
		return
	var angle := (clampf(pan, -1.0, 1.0) + 1.0) * PI * 0.25
	var stereo := Vector2(value * cos(angle), value * sin(angle))
	samples[index] = samples[index] + stereo


func _mix_stereo(samples: PackedVector2Array, index: int, left: float, right: float) -> void:
	if index < 0 or index >= samples.size():
		return
	samples[index] = samples[index] + Vector2(left, right)

func _attack_decay_envelope(
	elapsed: float,
	duration_seconds: float,
	attack_seconds: float,
	decay_power: float
) -> float:
	if elapsed < 0.0 or elapsed >= duration_seconds:
		return 0.0
	if attack_seconds > 0.0 and elapsed < attack_seconds:
		return sin((elapsed / attack_seconds) * PI * 0.5)
	var decay_duration := maxf(0.0001, duration_seconds - attack_seconds)
	var decay_progress := clampf((elapsed - attack_seconds) / decay_duration, 0.0, 1.0)
	return pow(1.0 - decay_progress, decay_power)

func _three_point_frequency(
	start_frequency: float,
	peak_frequency: float,
	end_frequency: float,
	peak_ratio: float,
	progress: float
) -> float:
	if peak_ratio <= 0.0:
		return _exp_lerp(peak_frequency, end_frequency, progress)
	if progress <= peak_ratio:
		return _exp_lerp(start_frequency, peak_frequency, progress / peak_ratio)
	return _exp_lerp(
		peak_frequency,
		end_frequency,
		(progress - peak_ratio) / maxf(0.0001, 1.0 - peak_ratio)
	)

func _exp_lerp(start_value: float, end_value: float, weight: float) -> float:
	var safe_start := maxf(0.001, start_value)
	var safe_end := maxf(0.001, end_value)
	return safe_start * pow(safe_end / safe_start, clampf(weight, 0.0, 1.0))

func _finalize_buffer(samples: PackedVector2Array) -> void:
	for index in samples.size():
		var frame := samples[index] * OUTPUT_GAIN
		frame.x = _soft_limit(frame.x)
		frame.y = _soft_limit(frame.y)
		samples[index] = frame

func _soft_limit(value: float) -> float:
	return value / (1.0 + absf(value) * 0.32)

func _measure_buffer(samples: PackedVector2Array, contacts: PackedFloat32Array) -> Dictionary:
	var peak := 0.0
	var sum_squares := 0.0
	var finite := true
	for frame in samples:
		if is_nan(frame.x) or is_inf(frame.x) or is_nan(frame.y) or is_inf(frame.y):
			finite = false
		peak = maxf(peak, maxf(absf(frame.x), absf(frame.y)))
		sum_squares += (frame.x * frame.x + frame.y * frame.y) * 0.5
	var rms := 0.0
	if not samples.is_empty():
		rms = sqrt(sum_squares / float(samples.size()))
	return {
		"frames": samples.size(),
		"duration_seconds": float(samples.size()) / MIX_RATE,
		"peak": peak,
		"rms": rms,
		"finite": finite,
		"contacts": contacts,
	}

func _window_rms(samples: PackedVector2Array, start_seconds: float, end_seconds: float) -> float:
	var start_frame := clampi(roundi(start_seconds * MIX_RATE), 0, samples.size())
	var end_frame := clampi(roundi(end_seconds * MIX_RATE), start_frame, samples.size())
	if end_frame <= start_frame:
		return 0.0
	var sum_squares := 0.0
	for index in range(start_frame, end_frame):
		var frame := samples[index]
		sum_squares += (frame.x * frame.x + frame.y * frame.y) * 0.5
	return sqrt(sum_squares / float(end_frame - start_frame))

func _window_delta_rms(samples: PackedVector2Array, start_seconds: float, end_seconds: float) -> float:
	var start_frame := clampi(roundi(start_seconds * MIX_RATE), 1, samples.size())
	var end_frame := clampi(roundi(end_seconds * MIX_RATE), start_frame, samples.size())
	if end_frame <= start_frame:
		return 0.0
	var sum_squares := 0.0
	for index in range(start_frame, end_frame):
		var delta := samples[index] - samples[index - 1]
		sum_squares += (delta.x * delta.x + delta.y * delta.y) * 0.5
	return sqrt(sum_squares / float(end_frame - start_frame))


func _window_mid_rms(samples: PackedVector2Array, start_seconds: float, end_seconds: float) -> float:
	var start_frame := clampi(roundi(start_seconds * MIX_RATE), 0, samples.size())
	var end_frame := clampi(roundi(end_seconds * MIX_RATE), start_frame, samples.size())
	if end_frame <= start_frame:
		return 0.0
	var sum_squares := 0.0
	for index in range(start_frame, end_frame):
		var frame := samples[index]
		var mid := (frame.x + frame.y) * 0.5
		sum_squares += mid * mid
	return sqrt(sum_squares / float(end_frame - start_frame))


func _window_side_rms(samples: PackedVector2Array, start_seconds: float, end_seconds: float) -> float:
	var start_frame := clampi(roundi(start_seconds * MIX_RATE), 0, samples.size())
	var end_frame := clampi(roundi(end_seconds * MIX_RATE), start_frame, samples.size())
	if end_frame <= start_frame:
		return 0.0
	var sum_squares := 0.0
	for index in range(start_frame, end_frame):
		var frame := samples[index]
		var side := (frame.x - frame.y) * 0.5
		sum_squares += side * side
	return sqrt(sum_squares / float(end_frame - start_frame))


func _sum_buffers(buffers: Array) -> PackedVector2Array:
	var frame_count := 0
	for buffer_value in buffers:
		var buffer := buffer_value as PackedVector2Array
		frame_count = maxi(frame_count, buffer.size())
	var summed := PackedVector2Array()
	summed.resize(frame_count)
	for buffer_value in buffers:
		var buffer := buffer_value as PackedVector2Array
		for index in buffer.size():
			summed[index] = summed[index] + buffer[index]
	return summed

func _positive_modulo(value: int, divisor: int) -> int:
	return ((value % divisor) + divisor) % divisor
