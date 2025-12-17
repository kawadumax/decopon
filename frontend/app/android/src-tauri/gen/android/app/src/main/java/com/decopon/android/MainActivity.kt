package com.decopon.android

import android.graphics.Rect
import android.os.Bundle
import android.view.View
import android.view.ViewTreeObserver
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import kotlin.math.max

class MainActivity : TauriActivity() {
  private val systemUiBridge by lazy { SystemUiBridge(this) }
  private var webView: WebView? = null
  private var lastImeInsetPx: Int = -1
  private var lastImeVisible: Boolean = false
  private var lastSystemBarInsets: Insets? = null
  private var hasImeInsetsListenerDispatch: Boolean = false
  private var globalLayoutListener: ViewTreeObserver.OnGlobalLayoutListener? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    this.webView = webView
    webView.addJavascriptInterface(systemUiBridge, "DecoponNative")
    setupImeInsetsListener(webView)
    emitImeInsetIfPossible()
  }

  override fun onDestroy() {
    removeGlobalLayoutListener()
    super.onDestroy()
  }

  private fun setupImeInsetsListener(targetView: View) {
    ViewCompat.setOnApplyWindowInsetsListener(targetView) { _, insets ->
      val imeInsets = insets.getInsets(WindowInsetsCompat.Type.ime())
      val systemBarInsets = insets.getInsets(
        WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout(),
      )
      val imeInsetPx = max(0, imeInsets.bottom - systemBarInsets.bottom)
      val imeVisible = insets.isVisible(WindowInsetsCompat.Type.ime())
      hasImeInsetsListenerDispatch = true
      if (updateImeState(imeInsetPx, imeVisible, systemBarInsets)) emitImeInsetIfPossible()
      insets
    }
    ViewCompat.getRootWindowInsets(targetView)?.let { rootInsets ->
      val systemBarInsets = rootInsets.getInsets(
        WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout(),
      )
      if (updateImeState(lastImeInsetPx, lastImeVisible, systemBarInsets)) {
        emitImeInsetIfPossible()
      }
    }
    ViewCompat.requestApplyInsets(targetView)
    setupGlobalLayoutFallback(targetView)
  }

  private fun setupGlobalLayoutFallback(targetView: View) {
    removeGlobalLayoutListener()
    val rootView = window.decorView
    val listener = ViewTreeObserver.OnGlobalLayoutListener {
      val rect = Rect()
      rootView.getWindowVisibleDisplayFrame(rect)
      val rootWindowInsets = ViewCompat.getRootWindowInsets(rootView)
      val systemBarInsets = rootWindowInsets?.getInsets(
        WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout(),
      )
      if (hasImeInsetsListenerDispatch) {
        if (updateImeState(lastImeInsetPx, lastImeVisible, systemBarInsets)) {
          emitImeInsetIfPossible()
        }
        return@OnGlobalLayoutListener
      }
      val height = rootView.height
      val visibleHeight = rect.height()
      val heightDiff = max(0, height - visibleHeight)
      val threshold = (height * 0.15f).toInt()
      val imeVisible = heightDiff >= threshold
      val imeInsetPx = if (imeVisible) {
        val insetTop = systemBarInsets?.top ?: 0
        val insetBottom = systemBarInsets?.bottom ?: 0
        max(0, heightDiff - insetTop - insetBottom)
      } else {
        0
      }
      if (updateImeState(imeInsetPx, imeVisible, systemBarInsets)) emitImeInsetIfPossible()
    }
    rootView.viewTreeObserver.addOnGlobalLayoutListener(listener)
    globalLayoutListener = listener
  }

  private fun removeGlobalLayoutListener() {
    val listener = globalLayoutListener ?: return
    val rootView = window.decorView
    rootView.viewTreeObserver.removeOnGlobalLayoutListener(listener)
    globalLayoutListener = null
  }

  private fun updateImeState(
    imeInsetPx: Int,
    imeVisible: Boolean,
    systemBarInsets: Insets? = null,
  ): Boolean {
    var changed = false
    if (imeInsetPx != lastImeInsetPx || imeVisible != lastImeVisible) {
      lastImeInsetPx = imeInsetPx
      lastImeVisible = imeVisible
      changed = true
    }
    if (systemBarInsets != null && systemBarInsets != lastSystemBarInsets) {
      lastSystemBarInsets = systemBarInsets
      changed = true
    }
    return changed
  }

  private fun emitImeInsetIfPossible() {
    val targetWebView = webView ?: return
    val inset = max(0, lastImeInsetPx)
    val isVisible = lastImeVisible || inset > 0
    val systemInsets = lastSystemBarInsets ?: Insets.NONE
    val script = """
      (function () {
        const detail = { inset: ${inset}, isVisible: ${isVisible} };
        window.__decoponImeState = detail;
        document.documentElement.style.setProperty("--twsa-safe-area-inset-top", "${systemInsets.top}px");
        document.documentElement.style.setProperty("--twsa-safe-area-inset-right", "${systemInsets.right}px");
        document.documentElement.style.setProperty("--twsa-safe-area-inset-bottom", "${systemInsets.bottom}px");
        document.documentElement.style.setProperty("--twsa-safe-area-inset-left", "${systemInsets.left}px");
        window.dispatchEvent(new CustomEvent("decopon:ime-inset", { detail }));
      })();
    """.trimIndent()

    targetWebView.post {
      targetWebView.evaluateJavascript(script, null)
    }
  }
}
