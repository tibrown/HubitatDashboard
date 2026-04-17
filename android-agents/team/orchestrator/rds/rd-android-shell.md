# RD-17007: Implement App Shell, Navigation, and DeviceViewModel

## Owner
frontend-dev

## Summary
The app shell is the persistent frame of the app: TopAppBar, BottomNavigationBar (top 5 groups), ModalNavigationDrawer (all 14 groups), and NavHost. DeviceViewModel is the central state holder wiring the data layer to the UI.

## Project Root
`C:\Projects\gitrepos\HubitatDashboard\android`

## Files to Create

### `ui/shell/MainScreen.kt`
```
@Composable
fun MainScreen(navController: NavHostController, viewModel: DeviceViewModel) {
    ModalNavigationDrawer(drawerContent = { GroupDrawer(...) }) {
        Scaffold(
            topBar = { HubitatTopBar(...) },
            bottomBar = { GroupBottomNav(...) }
        ) { padding ->
            Column {
                SystemStatusRow(viewModel)
                NavHost(navController, startDestination = "group/environment") {
                    composable("group/{groupId}") { GroupScreen(it.arguments?.getString("groupId")!!, viewModel) }
                    composable("settings") { SettingsScreen(...) }
                }
            }
        }
    }
}
```

### `ui/shell/GroupBottomNav.kt`
- Shows 5 fixed nav items: Environment, Security Alarm, Lights, Doors & Windows, Night Security.
- Each item has a Material icon and label.
- "More" item opens the drawer.
- Selected item highlights with Material 3 indicator.

### `ui/shell/GroupDrawer.kt`
- Lists all 14 groups with icon + label.
- Tapping a group navigates to it and closes the drawer.
- Includes drag handles for reorder (data persisted in DataStore — actual reorder logic is Phase 7 task 17014).

### `ui/shell/HubitatTopBar.kt`
- Title: current group display name.
- Actions: theme toggle button (sun/moon icon), settings gear icon.

### `viewmodel/DeviceViewModel.kt`
```
@HiltViewModel
class DeviceViewModel @Inject constructor(
    private val deviceRepository: DeviceRepository
) : ViewModel() {
    val devices: StateFlow<Map<String, DeviceState>>     // from repository
    val hsmStatus: StateFlow<HsmMode>
    val modes: StateFlow<List<HubMode>>
    val hubVariables: StateFlow<List<HubVariable>>
    val connectionStatus: StateFlow<ConnectionStatus>
    val activeConnection: StateFlow<ConnectionType>      // LOCAL/CLOUD

    fun sendCommand(deviceId: String, command: String, value: String? = null)
    fun setHsmMode(mode: String, pin: String)
    fun setMode(modeId: String, pin: String)
    fun setHubVariable(name: String, value: String)
    fun refresh()

    val snackbarMessage: SharedFlow<String>   // one-shot UI messages
}
```
All mutable operations launch coroutines in `viewModelScope`. Errors emit to `snackbarMessage`.

### `di/ViewModelModule.kt` (Hilt, if needed for non-HiltViewModel providers)

### `ui/shell/NavGraph.kt`
Define all routes as constants. At minimum: `"group/{groupId}"` and `"settings"`.

## Done Criteria
1. App launches, shows TopBar + BottomNav + NavHost without crash.
2. Tapping a BottomNav item navigates to the correct group route.
3. "More" button opens the drawer; tapping a group navigates and closes drawer.
4. Settings gear navigates to SettingsScreen.
5. `DeviceViewModel` initialises `DeviceRepository` and exposes non-null StateFlows.
6. `snackbarMessage` emissions render as a `SnackbarHost` Snackbar.
