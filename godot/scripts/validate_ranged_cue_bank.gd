extends SceneTree

const RangedBank = preload("res://scripts/audio/ranged_cue_bank.gd")

const MIX_RATE := 48000.0
const SAFE_PEAK := 0.6801
const CUE_IDS: Array[StringName] = [
	&"particle",
	&"ballistic_scatter",
	&"plasma",
]
const VARIATIONS: Array[Vector3] = [
	Vector3(1.000, 1.00, 1.00),
	Vector3(0.982, 1.04, 1.02),
	Vector3(1.014, 0.95, 0.98),
	Vector3(0.993, 1.06, 1.01),
	Vector3(1.018, 0.97, 0.97),
	Vector3(0.987, 1.02, 1.03),
]
const EXPECTED_DURATIONS := {
	&"particle": 0.320,
	&"ballistic_scatter": 0.300,
	&"plasma": 0.345,
}
const EXPECTED_CONTACTS := {
	&"particle": 0.250,
	&"ballistic_scatter": 0.210,
	&"plasma": 0.250,
}

var _failures: Array[String] = []


func _initialize() -> void:
	var bank := RangedBank.new()
	_validate_contract(bank)

	var peaks: Dictionary = {
		&"particle": [],
		&"ballistic_scatter": [],
		&"plasma": [],
	}
	var rms_values: Dictionary = {
		&"particle": [],
		&"ballistic_scatter": [],
		&"plasma": [],
	}

	for cue_id in CUE_IDS:
		var duration: float = bank.duration_seconds(cue_id)
		var cue_contacts: PackedFloat32Array = bank.contacts(cue_id)
		var expected_frames := roundi(duration * MIX_RATE)
		for variation_index in VARIATIONS.size():
			# Every cue/variation is rendered exactly twice so identity compares the
			# complete stereo PCM, including every deterministic noise source.
			var samples := bank.render_cue(cue_id, VARIATIONS[variation_index], variation_index, MIX_RATE)
			var repeated := bank.render_cue(cue_id, VARIATIONS[variation_index], variation_index, MIX_RATE)
			var metrics := _measure(samples)

			if not _buffers_match(samples, repeated):
				_fail("%s v%d repeat render was not sample-identical." % [cue_id, variation_index])
			if samples.size() != expected_frames:
				_fail("%s v%d rendered %d frames; expected %d." % [cue_id, variation_index, samples.size(), expected_frames])
			if not bool(metrics["finite"]):
				_fail("%s v%d contains non-finite PCM." % [cue_id, variation_index])
			if float(metrics["peak"]) <= 0.02 or float(metrics["rms"]) <= 0.003:
				_fail("%s v%d rendered an effectively silent buffer." % [cue_id, variation_index])
			if float(metrics["peak"]) > SAFE_PEAK:
				_fail("%s v%d peak %.5f exceeds the -3 dBFS-class headroom ceiling %.5f." % [cue_id, variation_index, float(metrics["peak"]), SAFE_PEAK])
			for contact in cue_contacts:
				var contact_frame := roundi(contact * MIX_RATE)
				if contact_frame < 0 or contact_frame >= samples.size():
					_fail("%s contact %.3f s is outside its buffer." % [cue_id, contact])

			(peaks[cue_id] as Array).append(float(metrics["peak"]))
			(rms_values[cue_id] as Array).append(float(metrics["rms"]))
			_validate_family_structure(cue_id, samples, variation_index)
			print(
				"[Ranged Cue Render] %s v%d frames=%d peak=%.5f rms=%.5f contact=%.3f" % [
					bank.display_name(cue_id),
					variation_index,
					samples.size(),
					float(metrics["peak"]),
					float(metrics["rms"]),
					cue_contacts[0],
				]
			)

	_validate_relative_hierarchy(peaks, rms_values)
	if not _failures.is_empty():
		push_error("Ranged cue bank failed %d deterministic checks." % _failures.size())
		quit(1)
		return

	print(
		"[Godot Ranged Cue Validator] PASS 3 cues x 6 variations x 2 renders; "
		+ "sample identity, authored contacts, structural windows, differentiation, and headroom hold."
	)
	quit(0)


func _validate_contract(bank: Variant) -> void:
	var actual_ids: Array[StringName] = bank.cue_ids()
	if actual_ids != CUE_IDS:
		_fail("Ranged cue IDs must be exactly particle, ballistic_scatter, and plasma in canonical order.")
	for cue_id in CUE_IDS:
		if not bank.supports_cue(cue_id):
			_fail("Expected ranged cue is unsupported: %s" % cue_id)
		var duration: float = bank.duration_seconds(cue_id)
		if not is_equal_approx(duration, float(EXPECTED_DURATIONS[cue_id])):
			_fail("%s duration %.6f does not match %.6f." % [cue_id, duration, float(EXPECTED_DURATIONS[cue_id])])
		if duration > 0.350:
			_fail("%s exceeds the routine-cue 350 ms ceiling." % cue_id)
		var cue_contacts: PackedFloat32Array = bank.contacts(cue_id)
		if cue_contacts.size() != 1 or not is_equal_approx(cue_contacts[0], float(EXPECTED_CONTACTS[cue_id])):
			_fail("%s must expose exactly the authored %.3f s projectile contact." % [cue_id, float(EXPECTED_CONTACTS[cue_id])])
		if bank.display_name(cue_id).is_empty():
			_fail("%s is missing its display name." % cue_id)
	for unsupported_id in [&"ballistic", &"laser", &"disruptor", &"vibro_blade", &"unknown"]:
		if bank.supports_cue(unsupported_id):
			_fail("Unsupported cue acquired an implicit ranged fallback: %s" % unsupported_id)


func _validate_family_structure(
	cue_id: StringName,
	samples: PackedVector2Array,
	variation_index: int
) -> void:
	match cue_id:
		&"particle":
			_validate_particle(samples, variation_index)
		&"ballistic_scatter":
			_validate_scatter(samples, variation_index)
		&"plasma":
			_validate_plasma(samples, variation_index)


func _validate_particle(samples: PackedVector2Array, variation_index: int) -> void:
	var pulse_windows: Array[Vector2] = [
		Vector2(0.006, 0.033),
		Vector2(0.047, 0.075),
		Vector2(0.091, 0.121),
	]
	for pulse_index in pulse_windows.size():
		var pulse := pulse_windows[pulse_index]
		var pulse_rms := _window_rms(samples, pulse.x, pulse.y)
		var early_delta := _window_delta_rms(samples, pulse.x, pulse.x + 0.008)
		var late_delta := _window_delta_rms(samples, pulse.y - 0.008, pulse.y)
		if pulse_rms <= 0.008:
			_fail("Particle v%d packet %d is not an audible micro-pulse." % [variation_index, pulse_index])
		if early_delta <= late_delta * 1.12:
			_fail("Particle v%d packet %d lacks a hard launch followed by descending instability." % [variation_index, pulse_index])
	var gap_one := _window_rms(samples, 0.036, 0.044)
	var gap_two := _window_rms(samples, 0.078, 0.087)
	var dry_flight := _window_rms(samples, 0.130, 0.240)
	if maxf(gap_one, gap_two) > 0.000001 or dry_flight > 0.000001:
		_fail("Particle v%d does not preserve dry separation between packet launches and contact." % variation_index)
	var launch_peak := _window_peak(samples, 0.006, 0.121)
	var contact_peak := _window_peak(samples, 0.250, 0.312)
	if contact_peak <= launch_peak:
		_fail("Particle v%d contact must remain louder than its packet launches." % variation_index)


func _validate_scatter(samples: PackedVector2Array, variation_index: int) -> void:
	var launch_peak := _window_peak(samples, 0.004, 0.070)
	var contact_peak := _window_peak(samples, 0.210, 0.282)
	var flight_rms := _window_rms(samples, 0.080, 0.200)
	if launch_peak <= 0.08:
		_fail("Scatter v%d lacks its immediate kinetic launch crack/body." % variation_index)
	if flight_rms > 0.000001:
		_fail("Scatter v%d has an unintended sustained or tonal projectile-flight layer." % variation_index)
	if contact_peak <= launch_peak:
		_fail("Scatter v%d contact must be the cue's strongest event." % variation_index)
	var pellet_deltas := PackedFloat32Array([
		_window_delta_rms(samples, 0.210, 0.219),
		_window_delta_rms(samples, 0.224, 0.232),
		_window_delta_rms(samples, 0.241, 0.250),
		_window_delta_rms(samples, 0.264, 0.274),
	])
	var minimum_delta := pellet_deltas[0]
	var maximum_delta := pellet_deltas[0]
	for delta_value in pellet_deltas:
		minimum_delta = minf(minimum_delta, delta_value)
		maximum_delta = maxf(maximum_delta, delta_value)
	if minimum_delta <= 0.004:
		_fail("Scatter v%d does not retain all four compact pellet impacts." % variation_index)
	if maximum_delta <= minimum_delta * 1.08:
		_fail("Scatter v%d pellet impacts became evenly repeated instead of uneven." % variation_index)


func _validate_plasma(samples: PackedVector2Array, variation_index: int) -> void:
	var containment_rms := _window_rms(samples, 0.060, 0.238)
	var release_rms := _window_rms(samples, 0.250, 0.294)
	var tail_rms := _window_rms(samples, 0.300, 0.344)
	if containment_rms <= 0.004:
		_fail("Plasma v%d lacks audible pre-contact containment instability." % variation_index)
	if release_rms <= containment_rms * 1.55:
		_fail("Plasma v%d dense hot release is not dominant over containment." % variation_index)
	if tail_rms <= 0.002 or tail_rms >= release_rms * 0.72:
		_fail("Plasma v%d cooling/sputter tail is missing or masks the hot release." % variation_index)
	if _window_peak(samples, 0.250, 0.294) <= _window_peak(samples, 0.060, 0.238):
		_fail("Plasma v%d contact must remain louder than pre-contact instability." % variation_index)


func _validate_relative_hierarchy(peaks: Dictionary, rms_values: Dictionary) -> void:
	for variation_index in VARIATIONS.size():
		var particle_peak := float((peaks[&"particle"] as Array)[variation_index])
		var scatter_peak := float((peaks[&"ballistic_scatter"] as Array)[variation_index])
		var plasma_peak := float((peaks[&"plasma"] as Array)[variation_index])
		var particle_rms := float((rms_values[&"particle"] as Array)[variation_index])
		var scatter_rms := float((rms_values[&"ballistic_scatter"] as Array)[variation_index])
		var plasma_rms := float((rms_values[&"plasma"] as Array)[variation_index])
		if scatter_peak <= particle_peak * 1.12 or scatter_peak <= plasma_peak * 1.04:
			_fail("Variation %d does not preserve Scatter Shot as the routine peak apex." % variation_index)
		if scatter_rms <= particle_rms * 1.20 or scatter_rms <= plasma_rms * 1.04:
			_fail("Variation %d does not preserve Scatter Shot as the routine RMS apex." % variation_index)
		if plasma_rms <= particle_rms * 1.05:
			_fail("Variation %d does not preserve Plasma Burst's heavier/longer body over Particle Carbine." % variation_index)


func _measure(samples: PackedVector2Array) -> Dictionary:
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
	return {"peak": peak, "rms": rms, "finite": finite}


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


func _window_peak(samples: PackedVector2Array, start_seconds: float, end_seconds: float) -> float:
	var start_frame := clampi(roundi(start_seconds * MIX_RATE), 0, samples.size())
	var end_frame := clampi(roundi(end_seconds * MIX_RATE), start_frame, samples.size())
	var peak := 0.0
	for index in range(start_frame, end_frame):
		peak = maxf(peak, maxf(absf(samples[index].x), absf(samples[index].y)))
	return peak


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


func _buffers_match(left: PackedVector2Array, right: PackedVector2Array) -> bool:
	if left.size() != right.size():
		return false
	for index in left.size():
		if left[index] != right[index]:
			return false
	return true


func _fail(message: String) -> void:
	_failures.append(message)
	push_error(message)
