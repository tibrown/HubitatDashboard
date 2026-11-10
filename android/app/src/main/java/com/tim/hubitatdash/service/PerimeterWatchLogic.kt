package com.tim.hubitatdash.service

import android.location.Location

/**
 * Pure geometry + state-transition logic for Perimeter Watch.
 * No I/O, no Android services — kept separate so the math is trivially testable.
 */
object PerimeterWatchLogic {
    private const val METERS_PER_MILE = 1609.344f

    /** Distance in miles between two lat/lng pairs (via Android's Location.distanceBetween). */
    fun distanceMiles(lat1: Double, lng1: Double, lat2: Double, lng2: Double): Float {
        val results = FloatArray(1)
        Location.distanceBetween(lat1, lng1, lat2, lng2, results)
        return results[0] / METERS_PER_MILE
    }

    /**
     * Edge-triggered alert decision: fire only on the OUTSIDE→INSIDE crossing so the user is
     * alerted once per approach, not on every location sample while already inside the radius.
     */
    fun shouldAlert(wasInside: Boolean, inRadius: Boolean): Boolean = inRadius && !wasInside

    /** Next persisted "inside perimeter" state. */
    fun nextInsideState(wasInside: Boolean, inRadius: Boolean): Boolean = inRadius
}
