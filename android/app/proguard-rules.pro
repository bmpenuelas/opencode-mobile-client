# Keep Capacitor bridge classes — used for reflection-based plugin dispatch
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.android.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }

# Keep registered plugins
-keep class com.getcapacitor.plugin.** { *; }
-keep class capgo.capacitorinappbrowser.** { *; }
-keep class com.aparajita.capacitor.securestorage.** { *; }

# Keep app entry point
-keep class com.logicedge.opencodemobile.MainActivity { *; }

# Keep @JavascriptInterface methods (safety net for WebView bridges)
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve line numbers for crash stack traces
-keepattributes SourceFile,LineNumberTable

# ML Kit is excluded in build.gradle, along with what it brought in. The barcode library only
# reaches these when asked to use ML Kit, apart from an annotation that nothing reads at runtime.
-dontwarn com.google.mlkit.**
-dontwarn com.google.android.gms.tasks.**
-dontwarn com.google.gson.annotations.SerializedName
