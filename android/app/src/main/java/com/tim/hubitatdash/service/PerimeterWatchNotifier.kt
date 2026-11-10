package com.tim.hubitatdash.service

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

/**
 * Posts the Perimeter Watch alert: a high-importance notification whose channel is allowed to
 * play sound. The channel is created lazily on first use (NotificationManager keeps it after
 * that; subsequent createNotificationChannel calls with the same ID are no-ops).
 *
 * Sound reproduces only when the device is not in Do Not Disturb and volume is up — that is a
 * platform limit; the notification itself always posts.
 */
object PerimeterWatchNotifier {
    private const val CHANNEL_ID = "perimeter_watch"
    private const val NOTIF_ID = 6001

    fun show(context: Context, distanceMiles: Float, radiusMiles: Float) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED
        ) {
            return
        }

        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL_ID, "Perimeter Watch", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Alerts when the two phones are within range of each other"
                // IMPORTANCE_HIGH plays sound by default; set the default tone explicitly so the
                // user can change it later in system settings per-channel if they want.
                setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION), null)
            }
        )

        val text = String.format(
            "The traveling phone is %.2f mi away (radius %.1f mi).",
            distanceMiles, radiusMiles
        )

        nm.notify(
            NOTIF_ID,
            NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_menu_compass)
                .setContentTitle("Perimeter Watch")
                .setContentText(text)
                .setStyle(NotificationCompat.BigTextStyle().bigText(text))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .build()
        )
    }
}
