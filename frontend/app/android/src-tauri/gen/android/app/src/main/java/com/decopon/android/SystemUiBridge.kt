package com.decopon.android

import android.app.Activity
import android.graphics.Color
import android.util.Log
import android.webkit.JavascriptInterface
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat.BEHAVIOR_SHOW_BARS_BY_SWIPE

class SystemUiBridge(private val activity: Activity) {
  @JavascriptInterface
  fun applyTheme(mode: String?) {
    Log.d("SystemUiBridge", "applyTheme called with mode=$mode")

    val normalized = when (mode?.lowercase()) {
      "dark" -> "dark"
      "light" -> "light"
      else -> "system"
    }

    when (normalized) {
      "dark" -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES)
      "light" -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO)
      else -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM)
    }

    activity.runOnUiThread {
      val window = activity.window ?: return@runOnUiThread
      val controller =
        WindowCompat.getInsetsController(window, window.decorView) ?: return@runOnUiThread

      val isLightBars = normalized != "dark"
      controller.isAppearanceLightStatusBars = isLightBars
      controller.isAppearanceLightNavigationBars = isLightBars
      controller.systemBarsBehavior = BEHAVIOR_SHOW_BARS_BY_SWIPE

      val statusBarColor = if (normalized == "dark") "#0f172a" else "#f8fafc"
      window.statusBarColor = Color.parseColor(statusBarColor)
      window.navigationBarColor = Color.parseColor(statusBarColor)
    }
  }
}
