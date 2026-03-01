package com.decopon.android

import android.app.Activity
import android.content.res.Configuration
import android.graphics.Color
import android.util.Log
import android.webkit.JavascriptInterface
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE

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

    val isDarkMode = when (normalized) {
      "dark" -> true
      "light" -> false
      else -> {
        val nightMode = activity.resources.configuration.uiMode and
          Configuration.UI_MODE_NIGHT_MASK
        nightMode == Configuration.UI_MODE_NIGHT_YES
      }
    }

    @Suppress("DEPRECATION") // setStatusBarColor/setNavigationBarColor are deprecated on API 34+ but required for explicit bar colors.
    activity.runOnUiThread {
      val window = activity.window
      val controller = WindowCompat.getInsetsController(window, window.decorView)

      controller.isAppearanceLightStatusBars = !isDarkMode
      controller.isAppearanceLightNavigationBars = !isDarkMode
      controller.systemBarsBehavior = BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE

      val systemBarColor = if (isDarkMode) "#0f172a" else "#f8fafc"
      window.statusBarColor = Color.parseColor(systemBarColor)
      window.navigationBarColor = Color.parseColor(systemBarColor)
    }
  }
}
