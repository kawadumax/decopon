package com.decopon.android

import android.app.Activity
import android.graphics.Rect
import android.view.View
import android.view.ViewTreeObserver
import android.webkit.WebView
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import kotlin.math.max
import kotlin.math.round

class ImeInsetsController(private val activity: Activity) {
  private var webView: WebView? = null
  private var lastImeInsetPx: Int = -1
  private var lastImeVisible: Boolean = false
  private var lastRawImeInsetPx: Int = 0
  private var lastSystemBarTop: Int = 0
  private var lastSystemBarBottom: Int = 0
  private var lastSystemBarLeft: Int = 0
  private var lastSystemBarRight: Int = 0
  private var hasImeInsetsListenerDispatch: Boolean = false
  private var globalLayoutListener: ViewTreeObserver.OnGlobalLayoutListener? = null

  fun attach(webView: WebView) {
    this.webView = webView
    setupImeInsetsListener()
    emitImeInsetIfPossible()
  }

  fun detach() {
    removeGlobalLayoutListener()
    webView = null
  }

  private fun setupImeInsetsListener() {
    val rootView = activity.window.decorView
    ViewCompat.setOnApplyWindowInsetsListener(rootView) { _, insets ->
      handleWindowInsets(rootView, insets)
      insets
    }
    ViewCompat.getRootWindowInsets(rootView)?.let { rootInsets ->
      handleWindowInsets(rootView, rootInsets)
    }
    ViewCompat.requestApplyInsets(rootView)
    setupGlobalLayoutFallback(rootView)
  }

  private fun setupGlobalLayoutFallback(targetView: View) {
    removeGlobalLayoutListener()
    val rootView = activity.window.decorView
    val listener = ViewTreeObserver.OnGlobalLayoutListener {
      val rect = Rect()
      rootView.getWindowVisibleDisplayFrame(rect)
      val rootWindowInsets = ViewCompat.getRootWindowInsets(rootView)
      val systemBarInsets = rootWindowInsets?.getInsets(
        WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout(),
      )
      lastSystemBarTop = systemBarInsets?.top ?: 0
      lastSystemBarBottom = systemBarInsets?.bottom ?: 0
      lastSystemBarLeft = systemBarInsets?.left ?: 0
      lastSystemBarRight = systemBarInsets?.right ?: 0
      if (hasImeInsetsListenerDispatch) {
        if (updateImeState(lastImeInsetPx, lastImeVisible)) {
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
      if (updateImeState(imeInsetPx, imeVisible)) emitImeInsetIfPossible()
    }
    rootView.viewTreeObserver.addOnGlobalLayoutListener(listener)
    globalLayoutListener = listener
  }

  private fun removeGlobalLayoutListener() {
    val listener = globalLayoutListener ?: return
    val rootView = activity.window.decorView
    rootView.viewTreeObserver.removeOnGlobalLayoutListener(listener)
    globalLayoutListener = null
  }

  private fun handleWindowInsets(
    rootView: View,
    insets: WindowInsetsCompat,
  ) {
    val imeInsets = insets.getInsets(WindowInsetsCompat.Type.ime())
    val systemBarInsets = insets.getInsets(
      WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout(),
    )
    val imeVisible = insets.isVisible(WindowInsetsCompat.Type.ime())
    val imeInsetRaw = max(0, imeInsets.bottom)
    lastRawImeInsetPx = imeInsetRaw
    lastSystemBarTop = systemBarInsets.top
    lastSystemBarBottom = systemBarInsets.bottom
    lastSystemBarLeft = systemBarInsets.left
    lastSystemBarRight = systemBarInsets.right

    val rect = Rect()
    rootView.getWindowVisibleDisplayFrame(rect)
    val heightDiff = max(0, rootView.height - rect.height())
    val insetTop = systemBarInsets.top
    val insetBottom = systemBarInsets.bottom
    val imeInsetFromLayout = if (imeVisible) {
      max(0, heightDiff - insetTop - insetBottom)
    } else {
      0
    }
    val adjustedImeInset = max(0, imeInsetRaw - insetBottom)
    val imeInsetPx = if (imeInsetFromLayout > 0 && imeInsetFromLayout < adjustedImeInset) {
      imeInsetFromLayout
    } else if (imeVisible) {
      adjustedImeInset
    } else {
      0
    }

    hasImeInsetsListenerDispatch = true
    if (updateImeState(imeInsetPx, imeVisible)) emitImeInsetIfPossible()
  }

  private fun updateImeState(
    imeInsetPx: Int,
    imeVisible: Boolean,
  ): Boolean {
    var changed = false
    if (imeInsetPx != lastImeInsetPx || imeVisible != lastImeVisible) {
      lastImeInsetPx = imeInsetPx
      lastImeVisible = imeVisible
      changed = true
    }
    return changed
  }

  private fun toCssPx(px: Int): Int {
    val density = activity.resources.displayMetrics.density
    if (density <= 0f) return px
    return round(px / density).toInt()
  }

  private fun emitImeInsetIfPossible() {
    val targetWebView = webView ?: return
    val inset = max(0, lastImeInsetPx)
    val insetCss = toCssPx(inset)
    val rawInsetCss = toCssPx(max(0, lastRawImeInsetPx))
    val safeAreaTopCss = toCssPx(max(0, lastSystemBarTop))
    val safeAreaBottomCss = toCssPx(max(0, lastSystemBarBottom))
    val safeAreaLeftCss = toCssPx(max(0, lastSystemBarLeft))
    val safeAreaRightCss = toCssPx(max(0, lastSystemBarRight))
    val isVisible = lastImeVisible || inset > 0
    val script = """
      (function () {
        const detail = {
          inset: ${insetCss},
          isVisible: ${isVisible},
          rawInset: ${rawInsetCss},
          safeAreaTop: ${safeAreaTopCss},
          safeAreaBottom: ${safeAreaBottomCss},
          safeAreaLeft: ${safeAreaLeftCss},
          safeAreaRight: ${safeAreaRightCss}
        };
        window.__decoponImeState = detail;
        const root = document.documentElement;
        if (root) {
          root.style.setProperty("--decopon-safe-area-top", "${safeAreaTopCss}px");
          root.style.setProperty("--decopon-safe-area-bottom", "${safeAreaBottomCss}px");
          root.style.setProperty("--decopon-safe-area-left", "${safeAreaLeftCss}px");
          root.style.setProperty("--decopon-safe-area-right", "${safeAreaRightCss}px");
        }
        window.dispatchEvent(new CustomEvent("decopon:ime-inset", { detail }));
      })();
    """.trimIndent()

    targetWebView.post {
      targetWebView.evaluateJavascript(script, null)
    }
  }
}
