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

const CUE_IDS: Array[StringName] = [
	&"vibro_blade",
	&"twin_vibro_daggers",
	&"heavy_smash",
	&"concussive_shove",
]

const CUE_DURATIONS := {
	&"vibro_blade": 0.30,
	&"twin_vibro_daggers": 0.225,
	&"heavy_smash": 0.34,
	&"concussive_shove": 0.29,
}

const CUE_CONTACTS := {
	&"vibro_blade": [MELEE_CONTACT_SECONDS],
	&"twin_vibro_daggers": [DAGGER_FIRST_CONTACT_SECONDS, DAGGER_SECOND_CONTACT_SECONDS],
	&"heavy_smash": [MELEE_CONTACT_SECONDS],
	&"concussive_shove": [MELEE_CONTACT_SECONDS],
}

const CUE_NAMES := {
	&"vibro_blade": "VIBRO-BLADE",
	&"twin_vibro_daggers": "TWIN VIBRO-DAGGERS",
	&"heavy_smash": "HEAVY SMASH",
	&"concussive_shove": "CONCUSSIVE SHOVE",
}

const CUE_SEEDS := {
	&"vibro_blade": 0x17A31,
	&"twin_vibro_daggers": 0x2D449,
	&"heavy_smash": 0x38C57,
	&"concussive_shove": 0x4B66D,
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

var _player: AudioStreamPlayer
var _playback: AudioStreamGeneratorPlayback
var _pending_samples := PackedVector2Array()
var _pending_cursor := 0
var _variation_sequence := 0
var _muted := false
var _output_db := DEFAULT_OUTPUT_DB
var _playback_end_msec := 0

func _ready() -> void:
	var generator := AudioStreamGenerator.new()
	generator.mix_rate = MIX_RATE
	generator.buffer_length = GENERATOR_BUFFER_SECONDS

	_player = AudioStreamPlayer.new()
	_player.name = "NativeProceduralOutput"
	_player.stream = generator
	_player.volume_db = _output_db
	add_child(_player)

func _process(_delta: float) -> void:
	_pump_generator()
	if _playback_end_msec > 0 and Time.get_ticks_msec() >= _playback_end_msec:
		_player.stop()
		_playback = null
		_playback_end_msec = 0

func audition(cue_id: StringName) -> Dictionary:
	if not CUE_IDS.has(cue_id):
		push_error("Unknown combat audio cue: %s" % cue_id)
		return {}

	var sequence := _variation_sequence
	var variation_index := _positive_modulo(sequence, VARIATIONS.size())
	var samples := _render_cue(cue_id, sequence)
	_variation_sequence += 1
	_replace_pending(samples)

	var duration := float(CUE_DURATIONS[cue_id])
	var contacts := _contacts_for(cue_id)
	cue_started.emit(
		cue_id,
		str(CUE_NAMES[cue_id]),
		variation_index,
		duration,
		contacts
	)
	return _measure_buffer(samples, contacts)

func audition_sequence() -> Dictionary:
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
		"FOUR-MOVE AUDITION",
		first_variation,
		cursor_seconds,
		absolute_contacts
	)
	return _measure_buffer(combined, absolute_contacts)

func reset_variation_sequence() -> void:
	_variation_sequence = 0
	stop()

func stop() -> void:
	_pending_samples = PackedVector2Array()
	_pending_cursor = 0
	_playback_end_msec = 0
	if _player != null:
		_player.stop()
	_playback = null

func shutdown() -> void:
	stop()
	if _player != null:
		_player.stream = null
		_player.queue_free()
		_player = null

func toggle_muted() -> bool:
	set_muted(not _muted)
	return _muted

func set_muted(muted: bool) -> void:
	_muted = muted
	if _player != null:
		_player.volume_db = -80.0 if _muted else _output_db
	mute_changed.emit(_muted)

func is_muted() -> bool:
	return _muted

func set_output_db(level_db: float) -> void:
	_output_db = clampf(level_db, -24.0, 0.0)
	if _player != null and not _muted:
		_player.volume_db = _output_db

func get_pending_frame_count() -> int:
	return maxi(0, _pending_samples.size() - _pending_cursor)

func get_generator_skips() -> int:
	if _playback == null:
		return 0
	return _playback.get_skips()

func cue_metadata(cue_id: StringName) -> Dictionary:
	if not CUE_IDS.has(cue_id):
		return {}
	return {
		"display_name": str(CUE_NAMES[cue_id]),
		"duration_seconds": float(CUE_DURATIONS[cue_id]),
		"contacts": _contacts_for(cue_id),
	}

# This checks deterministic in-memory rendering, contact bounds, finite samples,
# and generator-facing buffer shape. It is not a listening or latency test.
func run_render_smoke_test() -> bool:
	var passed := true
	for cue_index in CUE_IDS.size():
		var cue_id := CUE_IDS[cue_index]
		var samples := _render_cue(cue_id, cue_index)
		var contacts := _contacts_for(cue_id)
		var expected_frames := roundi(float(CUE_DURATIONS[cue_id]) * MIX_RATE)
		var metrics := _measure_buffer(samples, contacts)

		if samples.size() != expected_frames:
			push_error("%s rendered %d frames; expected %d." % [cue_id, samples.size(), expected_frames])
			passed = false
		if not bool(metrics["finite"]) or float(metrics["peak"]) <= 0.01:
			push_error("%s rendered invalid or silent samples." % cue_id)
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
					"Twin Vibro-Daggers notch RMS %.8f exceeds threshold %.8f." % [
						notch_rms,
						allowed_notch_rms,
					]
				)
				passed = false
			print(
				"[Combat Audio Render] DAGGER_NOTCH 120-142ms rms=%.8f first_rms=%.4f second_rms=%.4f" % [
					notch_rms,
					first_contact_rms,
					second_contact_rms,
				]
			)

		print(
			"[Combat Audio Render] %s frames=%d peak=%.4f rms=%.4f contacts=%s" % [
				CUE_NAMES[cue_id],
				samples.size(),
				float(metrics["peak"]),
				float(metrics["rms"]),
				str(contacts),
			]
		)
	return passed

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
		_:
			push_error("No renderer for cue: %s" % cue_id)
	_finalize_buffer(samples)
	return samples

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
	# Two different directional gestures surround a deliberate notch. The 60 ms
	# contact separation is fixed; the second hit is brighter and stronger.
	_add_highpass_noise(
		samples,
		_make_rng(&"twin_vibro_daggers", sequence, 0),
		0.048,
		0.035,
		1250.0 * variation.y,
		2450.0 * variation.y,
		0.012,
		0.080,
		1.2,
		-0.52
	)
	_add_band_noise(
		samples,
		_make_rng(&"twin_vibro_daggers", sequence, 1),
		DAGGER_FIRST_CONTACT_SECONDS,
		0.030 * variation.z,
		2800.0 * variation.y,
		3200.0 * variation.y,
		0.006,
		1550.0 * variation.y,
		1.65,
		0.0025,
		0.27,
		1.35,
		-0.58,
		-0.42
	)
	_add_tone(
		samples,
		DAGGER_FIRST_CONTACT_SECONDS,
		0.032 * variation.z,
		1750.0 * variation.x,
		1320.0 * variation.x,
		0.0025,
		0.032,
		1.8,
		&"unstable_metal",
		-0.46,
		0.021
	)

	_add_band_noise(
		samples,
		_make_rng(&"twin_vibro_daggers", sequence, 2),
		DAGGER_SECOND_CONTACT_SECONDS,
		0.046 * variation.z,
		3650.0 * variation.y,
		4250.0 * variation.y,
		0.008,
		1900.0 * variation.y,
		1.72,
		0.0025,
		0.39,
		1.25,
		0.48,
		0.64
	)
	_add_tone(
		samples,
		DAGGER_SECOND_CONTACT_SECONDS,
		0.050 * variation.z,
		2250.0 * variation.x,
		1580.0 * variation.x,
		0.0025,
		0.047,
		1.7,
		&"unstable_metal",
		0.52,
		0.027
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

func _positive_modulo(value: int, divisor: int) -> int:
	return ((value % divisor) + divisor) % divisor
