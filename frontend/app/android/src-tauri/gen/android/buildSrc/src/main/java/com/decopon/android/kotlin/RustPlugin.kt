import com.android.build.api.dsl.ApplicationExtension
import org.gradle.api.DefaultTask
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.kotlin.dsl.configure
import org.gradle.kotlin.dsl.get

const val TASK_GROUP = "rust"

open class Config {
    lateinit var rootDirRel: String
}

open class RustPlugin : Plugin<Project> {
    private lateinit var config: Config

    override fun apply(project: Project) = with(project) {
        config = extensions.create("rust", Config::class.java)

        // Debug ビルド時はエミュレータ向け x86/x86_64 も必要になるため、
        // 明示的な指定がない場合は Debug タスクではフル ABI を有効化する。
        val isDebugInvocation = gradle.startParameter.taskNames.any { it.contains("Debug", ignoreCase = true) }
        val useFullAbiMatrix = (findProperty("fullAbiMatrix") as? String)?.toBoolean() ?: isDebugInvocation
        val defaultAbiList = if (useFullAbiMatrix) {
            listOf("arm64-v8a", "armeabi-v7a", "x86", "x86_64")
        } else {
            listOf("arm64-v8a")
        }
        val abiList = (findProperty("abiList") as? String)
            ?.split(',')
            ?.mapNotNull { it.trim().ifBlank { null } }
            ?.toList()
            .orEmpty()

        val defaultArchList = if (useFullAbiMatrix) {
            listOf("arm64", "arm", "x86", "x86_64")
        } else {
            listOf("arm64")
        }
        val archList = (findProperty("archList") as? String)
            ?.split(',')
            ?.mapNotNull { it.trim().ifBlank { null } }
            ?.toList()
            .orEmpty()

        val defaultTargetsList = if (useFullAbiMatrix) {
            listOf("aarch64", "armv7", "i686", "x86_64")
        } else {
            listOf("aarch64")
        }
        val targetsList = (findProperty("targetList") as? String)
            ?.split(',')
            ?.mapNotNull { it.trim().ifBlank { null } }
            ?.toList()
            .orEmpty()

        val archAbiPairs = archList.zip(abiList).ifEmpty { defaultArchList.zip(defaultAbiList) }
        val resolvedTargets = targetsList.ifEmpty { defaultTargetsList }

        extensions.configure<ApplicationExtension> {
            @Suppress("UnstableApiUsage")
            flavorDimensions.add("abi")
            productFlavors {
                create("universal") {
                    dimension = "abi"
                    ndk {
                        abiFilters.clear()
                        abiFilters += archAbiPairs.map { it.second }
                    }
                }
                archAbiPairs.forEach { (arch, abi) ->
                    create(arch) {
                        dimension = "abi"
                        ndk {
                            abiFilters.clear()
                            abiFilters.add(abi)
                        }
                    }
                }
            }
        }

        afterEvaluate {
            for (profile in listOf("debug", "release")) {
                val profileCapitalized = profile.replaceFirstChar { it.uppercase() }
                val buildTask = tasks.maybeCreate(
                    "rustBuildUniversal$profileCapitalized",
                    DefaultTask::class.java
                ).apply {
                    group = TASK_GROUP
                    description = "Build dynamic library in $profile mode for all targets"
                }

                tasks["mergeUniversal${profileCapitalized}JniLibFolders"].dependsOn(buildTask)

                archAbiPairs.forEachIndexed { index, archAbiPair ->
                    val targetName = resolvedTargets.getOrNull(index) ?: resolvedTargets.last()
                    val targetArch = archAbiPair.first
                    val targetArchCapitalized = targetArch.replaceFirstChar { it.uppercase() }
                    val targetBuildTask = project.tasks.maybeCreate(
                        "rustBuild$targetArchCapitalized$profileCapitalized",
                        BuildTask::class.java
                    ).apply {
                        group = TASK_GROUP
                        description = "Build dynamic library in $profile mode for $targetArch"
                        rootDirRel = config.rootDirRel
                        target = targetName
                        release = profile == "release"
                    }

                    buildTask.dependsOn(targetBuildTask)
                    tasks["merge$targetArchCapitalized${profileCapitalized}JniLibFolders"].dependsOn(
                        targetBuildTask
                    )
                }
            }
        }
    }
}
