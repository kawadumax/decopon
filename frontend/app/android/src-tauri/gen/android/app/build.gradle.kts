import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("rust")
}

val tauriProperties = Properties().apply {
    val propFile = file("tauri.properties")
    if (propFile.exists()) {
        propFile.inputStream().use { load(it) }
    }
}

val keystoreProperties = Properties().apply {
    val propsFile = rootProject.file("keystore.properties")
    if (propsFile.exists()) {
        propsFile.inputStream().use { load(it) }
    }
}

fun resolveCredential(vararg keys: String): String? =
    keys.asSequence()
        .mapNotNull { key ->
            keystoreProperties.getProperty(key)?.takeIf { it.isNotBlank() }
                ?: System.getenv(key)?.takeIf { it.isNotBlank() }
        }
        .firstOrNull()

val releaseStoreFile = resolveCredential("storeFile", "TAURI_ANDROID_KEYSTORE_PATH")
val releaseStorePassword = resolveCredential("storePassword", "TAURI_ANDROID_KEYSTORE_PASSWORD")
val releaseKeyAlias = resolveCredential("keyAlias", "TAURI_ANDROID_KEY_ALIAS")
val releaseKeyPassword = resolveCredential("keyPassword", "TAURI_ANDROID_KEY_PASSWORD")
val hasReleaseSigning =
    listOf(releaseStoreFile, releaseStorePassword, releaseKeyAlias, releaseKeyPassword).all { !it.isNullOrBlank() }
val projectLogger = logger

android {
    compileSdk = 36
    namespace = "com.decopon.android"
    defaultConfig {
        manifestPlaceholders["usesCleartextTraffic"] = "false"
        applicationId = "com.decopon.android"
        minSdk = 24
        targetSdk = 36
        versionCode = tauriProperties.getProperty("tauri.android.versionCode", "1").toInt()
        versionName = tauriProperties.getProperty("tauri.android.versionName", "1.0")
    }
    val releaseSigningConfig = if (hasReleaseSigning) {
        signingConfigs.create("release") {
            storeFile = file(releaseStoreFile!!)
            storePassword = releaseStorePassword!!
            keyAlias = releaseKeyAlias!!
            keyPassword = releaseKeyPassword!!
        }
    } else {
        projectLogger.lifecycle(
            "Android release keystore credentials are missing; release artifacts will be unsigned.",
        )
        null
    }
    buildTypes {
        getByName("debug") {
            manifestPlaceholders["usesCleartextTraffic"] = "true"
            isDebuggable = true
            isJniDebuggable = true
            isMinifyEnabled = false
            packaging {                jniLibs.keepDebugSymbols.add("*/arm64-v8a/*.so")
                jniLibs.keepDebugSymbols.add("*/armeabi-v7a/*.so")
                jniLibs.keepDebugSymbols.add("*/x86/*.so")
                jniLibs.keepDebugSymbols.add("*/x86_64/*.so")
            }
        }
        getByName("release") {
            isMinifyEnabled = true
            proguardFiles(
                *fileTree(".") { include("**/*.pro") }
                    .plus(getDefaultProguardFile("proguard-android-optimize.txt"))
                    .toList().toTypedArray()
            )
            releaseSigningConfig?.let { signingConfig = it }
        }
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
    buildFeatures {
        buildConfig = true
    }
}

rust {
    rootDirRel = "../../../"
}

dependencies {
    implementation("androidx.webkit:webkit:1.14.0")
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("androidx.activity:activity-ktx:1.10.1")
    implementation("com.google.android.material:material:1.12.0")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.4")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.0")
}

apply(from = "tauri.build.gradle.kts")
