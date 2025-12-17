package com.decopon.android

import android.os.Bundle
import android.util.Log
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import kotlin.math.max

class MainActivity : TauriActivity() {
  private val systemUiBridge by lazy { SystemUiBridge(this) }
  private var webView: WebView? = null
  private var lastImeInsetPx: Int = -1

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    setupImeInsetsListener()
  }

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    this.webView = webView
    webView.addJavascriptInterface(systemUiBridge, "DecoponNative")
    emitImeInsetIfPossible()
  }

  private fun setupImeInsetsListener() {
    val rootView = window.decorView
    ViewCompat.setOnApplyWindowInsetsListener(rootView) { _, insets ->
      val imeInsets = insets.getInsets(WindowInsetsCompat.Type.ime())
      val systemBarInsets = insets.getInsets(WindowInsetsCompat.Type.systemBars())
      val imeInsetPx = max(0, imeInsets.bottom - systemBarInsets.bottom)
      if (imeInsetPx != lastImeInsetPx) {
        lastImeInsetPx = imeInsetPx
        Log.d("DecoponImeInsets", "imeInsetPx=$imeInsetPx systemBarsBottom=${systemBarInsets.bottom}")
        emitImeInsetIfPossible()
      }
      insets
    }
    ViewCompat.requestApplyInsets(rootView)
  }

  private fun emitImeInsetIfPossible() {
    val targetWebView = webView ?: return
    val inset = max(0, lastImeInsetPx)
    val script = """
      (function () {
        window.__decoponImeInsetPx = ${inset};
        window.dispatchEvent(new CustomEvent("decopon:ime-inset", { detail: { inset: ${inset} } }));
      })();
    """.trimIndent()

    targetWebView.post {
      targetWebView.evaluateJavascript(script, null)
    }
  }
}
