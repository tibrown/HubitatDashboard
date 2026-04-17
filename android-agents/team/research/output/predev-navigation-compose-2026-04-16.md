# Pre-Dev Research: Navigation Compose

**Date:** 2026-04-16
**Requested by:** frontend-dev
**For tasks:** 17007
**Sources:**
- https://developer.android.com/develop/ui/compose/navigation (2026-04-16)

---

## 1. Current Stable Version

**`androidx.navigation:navigation-compose:2.9.7`**

```kotlin
// app/build.gradle.kts
dependencies {
    implementation("androidx.navigation:navigation-compose:2.9.7")
}
```

---

## 2. Core Setup — NavController + NavHost

```kotlin
// MainActivity.kt or top-level composable
@Composable
fun HubitatApp() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = "device_list"  // or "settings" if no hub configured
    ) {
        composable("device_list") {
            DeviceListScreen(navController = navController)
        }
        composable("settings") {
            SettingsScreen(navController = navController)
        }
        composable(
            route = "group/{groupId}",
            arguments = listOf(navArgument("groupId") { type = NavType.StringType })
        ) { backStackEntry ->
            val groupId = backStackEntry.arguments?.getString("groupId") ?: return@composable
            GroupScreen(groupId = groupId, navController = navController)
        }
    }
}
```

---

## 3. Navigation Patterns

### Navigate to a route
```kotlin
navController.navigate("settings")
navController.navigate("group/living_room")
```

### Navigate with popUpTo (avoid stack buildup for bottom nav)
```kotlin
navController.navigate(item.route) {
    // Pop up to the start destination to avoid building up a large back stack
    popUpTo(navController.graph.findStartDestination().id) {
        saveState = true
    }
    launchSingleTop = true   // avoid multiple copies of the same destination
    restoreState = true       // restore state when re-selecting a previously selected item
}
```

### Navigate back
```kotlin
navController.popBackStack()
// or
navController.navigateUp()
```

### Navigate to Settings on first launch (no hub configured)
```kotlin
val navController = rememberNavController()
val settingsRepository: SettingsRepository = hiltViewModel<SettingsViewModel>()
    .settingsRepository

// Set startDestination based on whether hub is configured:
@Composable
fun HubitatApp(settingsViewModel: SettingsViewModel = hiltViewModel()) {
    val hasHubConfigured by settingsViewModel.hasHubConfigured.collectAsStateWithLifecycle()
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = if (hasHubConfigured) "device_list" else "settings"
    ) {
        // routes ...
    }
}
```

---

## 4. Route Arguments

### Path parameter (e.g., groupId)
```kotlin
// Define route with argument placeholder
composable(
    route = "group/{groupId}",
    arguments = listOf(navArgument("groupId") {
        type = NavType.StringType
        nullable = false
    })
) { backStackEntry ->
    val groupId = backStackEntry.arguments?.getString("groupId") ?: ""
    GroupScreen(groupId = groupId)
}

// Navigate
navController.navigate("group/${Uri.encode(groupId)}")  // encode for special chars
```

### Access argument in ViewModel via SavedStateHandle
```kotlin
@HiltViewModel
class GroupViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val deviceRepository: DeviceRepository
) : ViewModel() {
    val groupId: String = savedStateHandle.get<String>("groupId") ?: ""
    // OR with Navigation 2.8+:
    // val groupId: String = savedStateHandle["groupId"] ?: ""
}
```
> **Prefer `SavedStateHandle` over `backStackEntry.arguments`** — it survives process death and is survives configuration change.

---

## 5. BottomNavigationBar Integration

```kotlin
// Define navigation items
sealed class BottomNavItem(val route: String, val icon: ImageVector, val label: String) {
    object DeviceList : BottomNavItem("device_list", Icons.Default.Home, "Devices")
    object Groups    : BottomNavItem("groups",      Icons.Default.GridView, "Groups")
    object Settings  : BottomNavItem("settings",    Icons.Default.Settings, "Settings")
}

val bottomNavItems = listOf(
    BottomNavItem.DeviceList,
    BottomNavItem.Groups,
    BottomNavItem.Settings
)

// In Scaffold bottomBar:
@Composable
fun AppBottomBar(navController: NavController) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    NavigationBar {
        bottomNavItems.forEach { item ->
            NavigationBarItem(
                icon = { Icon(item.icon, contentDescription = item.label) },
                label = { Text(item.label) },
                selected = currentRoute == item.route,
                onClick = {
                    if (currentRoute != item.route) {
                        navController.navigate(item.route) {
                            popUpTo(navController.graph.findStartDestination().id) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                }
            )
        }
    }
}
```

---

## 6. ModalNavigationDrawer + NavController Integration

The drawer must close after navigation. Use `DrawerState` + `rememberCoroutineScope()`:

```kotlin
@Composable
fun AppShell() {
    val navController = rememberNavController()
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet {
                DrawerContent(
                    onNavigate = { route ->
                        scope.launch {
                            drawerState.close()   // close drawer BEFORE navigating
                        }
                        navController.navigate(route) {
                            launchSingleTop = true
                        }
                    }
                )
            }
        }
    ) {
        Scaffold(
            bottomBar = { AppBottomBar(navController) },
            topBar = {
                TopAppBar(
                    title = { Text("Hubitat Dashboard") },
                    navigationIcon = {
                        IconButton(onClick = { scope.launch { drawerState.open() } }) {
                            Icon(Icons.Default.Menu, contentDescription = "Menu")
                        }
                    }
                )
            }
        ) { padding ->
            NavHost(navController, startDestination = "device_list",
                    modifier = Modifier.padding(padding)) {
                // composable destinations
            }
        }
    }
}
```

---

## 7. Passing NavController vs. Hoisting Navigate Lambdas

**Official recommendation:** Do NOT pass `NavController` deep into the composable tree. Instead, **hoist navigate lambdas** as event callbacks.

```kotlin
// PREFERRED: hoist lambda
@Composable
fun GroupScreen(
    groupId: String,
    onNavigateToDevice: (deviceId: String) -> Unit,  // ← lambda, not NavController
    viewModel: GroupViewModel = hiltViewModel()
) {
    // ...
    TileGrid(
        onDeviceTap = { deviceId -> onNavigateToDevice(deviceId) }
    )
}

// In NavHost:
composable("group/{groupId}") { backStackEntry ->
    GroupScreen(
        groupId = backStackEntry.arguments?.getString("groupId") ?: "",
        onNavigateToDevice = { deviceId ->
            navController.navigate("device/$deviceId")
        }
    )
}
```

> **Why?** Passing `NavController` to leaf composables creates tight coupling and makes composables harder to test in isolation. Lambdas allow the composable to be previewed and unit-tested without a real `NavController`.

---

## Summary

Use `navigation-compose:2.9.7`. Create `NavController` with `rememberNavController()` at the top-level composable. Use `NavHost` with `composable("route/{arg}")` to define destinations. Pass `groupId` via route path param, retrieve in ViewModel via `SavedStateHandle`. For `NavigationBar` selection tracking, use `navController.currentBackStackEntryAsState().value?.destination?.route`. Close `ModalNavigationDrawer` before navigating by calling `drawerState.close()` in a coroutine. Hoist navigate lambdas rather than passing `NavController` to leaf composables.
