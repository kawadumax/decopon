package com.decopon.android

import android.os.Bundle
import android.webkit.WebView
import android.view.WindowManager
import androidx.core.view.WindowCompat

class MainActivity : TauriActivity() {
  private val systemUiBridge by lazy { SystemUiBridge(this) }
  private val imeInsetsController by lazy { ImeInsetsController(this) }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    WindowCompat.setDecorFitsSystemWindows(window, true)
    window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
  }

  override fun onResume() {
    super.onResume()
    window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
  }

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    webView.addJavascriptInterface(systemUiBridge, "DecoponNative")
    imeInsetsController.attach(webView)
  }

  override fun onDestroy() {
    imeInsetsController.detach()
    super.onDestroy()
  }
}
