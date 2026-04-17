# Research Request: Hilt Android DI

Requested by: architect, api-dev
For tasks: 17001, 17002, 17003, 17004, 17005

Questions:
- What is the latest stable Hilt Android version and what are all required dependencies (hilt-android, hilt-android-compiler, hilt-navigation-compose)?
- How is the Hilt Gradle plugin applied in settings.gradle.kts and app/build.gradle.kts using the version catalog / plugins block?
- What is the correct annotation sequence for bootstrapping: @HiltAndroidApp on Application, @AndroidEntryPoint on Activity, @HiltViewModel on ViewModel?
- How do you write a @Module + @InstallIn(SingletonComponent::class) object with @Provides methods for singleton OkHttpClient, Retrofit, and DataStore?
- What is the correct way to inject a @Singleton-scoped repository into a @HiltViewModel using constructor injection?
- How do you provide a Context inside a Hilt module (using @ApplicationContext)?
- What is the difference between @Singleton, @ActivityRetainedScoped, and @ViewModelScoped — when should each be used for network vs repository vs ViewModel dependencies?
- Are there any known Hilt version compatibility constraints with the current Compose BOM or AGP 8.x?
