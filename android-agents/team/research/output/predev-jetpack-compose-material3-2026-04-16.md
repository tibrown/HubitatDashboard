# Pre-Dev Research: Jetpack Compose + Material 3

**Date:** 2026-04-16
**Requested by:** architect, frontend-dev
**For tasks:** 17001, 17006, 17007, 17008, 17009, 17010, 17011, 17012, 17013, 17014
**Sources:**
- https://developer.android.com/jetpack/compose/bom (2026-04-16)
- https://developer.android.com/jetpack/compose/bom/bom-mapping (2026-04-16)
- https://developer.android.com/develop/ui/compose/components (2026-04-16)

---

## 1. Compose BOM — Latest Stable Version

**Latest stable BOM:** `androidx.compose:compose-bom:2026.03.00`

**Key library versions resolved by this BOM:**
| Artifact | Version |
|---|---|
| `androidx.compose.runtime:runtime` | 1.10.6 |
| `androidx.compose.ui:ui` | 1.10.6 |
| `androidx.compose.foundation:foundation` | 1.10.6 |
| `androidx.compose.material3:material3` | 1.4.0 |
| `androidx.compose.material:material-icons-extended` | 1.7.8 (**capped** — does not track BOM main version) |

> ⚠️ `material-icons-extended` is capped at 1.7.8 across all current BOM versions. Always declare it without a version when using BOM.

---

## 2. Gradle Setup (build.gradle.kts)

```kotlin
// app/build.gradle.kts
dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2026.03.00")
    implementation(composeBom)
    androidTestImplementation(composeBom)

    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.compose.foundation:foundation")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
```

---

## 3. Key Component APIs

### Card (with click + loading overlay)
```kotlin
Card(
    onClick = { /* handle click */ },
    modifier = Modifier.fillMaxWidth(),
    colors = CardDefaults.cardColors(
        containerColor = MaterialTheme.colorScheme.surfaceVariant
    )
) {
    Box(modifier = Modifier.fillMaxSize()) {
        // card content
        if (isLoading) {
            CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
        }
    }
}
```

### Chips (AssistChip, FilterChip, SuggestionChip)
```kotlin
// AssistChip — for actions suggested by system
AssistChip(
    onClick = { },
    label = { Text("Open") },
    leadingIcon = { Icon(Icons.Default.OpenInNew, contentDescription = null) }
)

// FilterChip — stateful on/off selection
FilterChip(
    selected = isSelected,
    onClick = { isSelected = !isSelected },
    label = { Text("Filter") },
    leadingIcon = if (isSelected) {
        { Icon(Icons.Filled.Done, contentDescription = null) }
    } else null
)

// SuggestionChip — for suggestions (no leading icon slot by default)
SuggestionChip(
    onClick = { },
    label = { Text("Suggestion") }
)
```

### LazyVerticalGrid (2-column fixed)
```kotlin
LazyVerticalGrid(
    columns = GridCells.Fixed(2),
    contentPadding = PaddingValues(8.dp),
    horizontalArrangement = Arrangement.spacedBy(8.dp),
    verticalArrangement = Arrangement.spacedBy(8.dp),
    modifier = Modifier.fillMaxSize()
) {
    items(items) { item ->
        Box(
            modifier = Modifier.aspectRatio(1f) // square cells
        ) {
            // tile content
        }
    }
}
```

### ModalNavigationDrawer
```kotlin
val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
val scope = rememberCoroutineScope()

ModalNavigationDrawer(
    drawerState = drawerState,
    drawerContent = {
        ModalDrawerSheet {
            Text("App Name", modifier = Modifier.padding(16.dp))
            Divider()
            NavigationDrawerItem(
                label = { Text("Settings") },
                selected = currentRoute == "settings",
                onClick = {
                    scope.launch { drawerState.close() }
                    navController.navigate("settings")
                }
            )
        }
    }
) {
    // Scaffold or main content here
    Scaffold(/* ... */) { paddingValues ->
        // content
    }
}
```
> The `drawerContent` lambda receives a column-like scope. Use `ModalDrawerSheet` as the container. Gesture-based open/close is enabled by default — set `gesturesEnabled = false` to disable.

### NavigationBar + NavigationBarItem (bottom nav)
```kotlin
val navBackStackEntry by navController.currentBackStackEntryAsState()
val currentRoute = navBackStackEntry?.destination?.route

NavigationBar {
    items.forEach { item ->
        NavigationBarItem(
            icon = { Icon(item.icon, contentDescription = item.label) },
            label = { Text(item.label) },
            selected = currentRoute == item.route,
            onClick = {
                navController.navigate(item.route) {
                    popUpTo(navController.graph.findStartDestination().id) {
                        saveState = true
                    }
                    launchSingleTop = true
                    restoreState = true
                }
            }
        )
    }
}
```

### Scaffold (Material 3)
```kotlin
Scaffold(
    topBar = {
        TopAppBar(
            title = { Text("Hubitat Dashboard") },
            navigationIcon = {
                IconButton(onClick = { scope.launch { drawerState.open() } }) {
                    Icon(Icons.Default.Menu, contentDescription = "Menu")
                }
            }
        )
    },
    bottomBar = {
        // NavigationBar goes here
    },
    snackbarHost = { SnackbarHost(snackbarHostState) },
    floatingActionButton = { /* optional FAB */ }
) { innerPadding ->
    // IMPORTANT: apply innerPadding to content
    Box(modifier = Modifier.padding(innerPadding)) {
        // screen content
    }
}
```

### AlertDialog
```kotlin
if (showDialog) {
    AlertDialog(
        onDismissRequest = { showDialog = false },
        title = { Text("Confirm Action") },
        text = { Text("Are you sure?") },
        confirmButton = {
            TextButton(onClick = { /* confirm */ showDialog = false }) {
                Text("Confirm")
            }
        },
        dismissButton = {
            TextButton(onClick = { showDialog = false }) {
                Text("Cancel")
            }
        }
    )
}
```
> For PIN entry dialogs: place a `TextField` in the `text` slot.

### Slider
```kotlin
var sliderValue by remember { mutableFloatStateOf(50f) }

Slider(
    value = sliderValue,
    onValueChange = { sliderValue = it },          // called continuously while dragging
    onValueChangeFinished = { sendToHub(sliderValue) }, // called once on release
    valueRange = 0f..100f,
    steps = 0,  // 0 = continuous; N = N intermediate stops between min/max
    modifier = Modifier.fillMaxWidth()
)
```
> Use `onValueChangeFinished` for expensive operations (network calls). `onValueChange` is for local UI updates only.

### SegmentedButton (SingleChoiceSegmentedButtonRow)
```kotlin
// ✅ STABLE in material3 1.3.0+ (BOM 2026.03.00 includes material3 1.4.0)
var selectedIndex by remember { mutableIntStateOf(0) }
val options = listOf("Day", "Week", "Month")

SingleChoiceSegmentedButtonRow {
    options.forEachIndexed { index, label ->
        SegmentedButton(
            shape = SegmentedButtonDefaults.itemShape(index = index, count = options.size),
            onClick = { selectedIndex = index },
            selected = index == selectedIndex,
            label = { Text(label) }
        )
    }
}
```
> `SingleChoiceSegmentedButtonRow` and `SegmentedButton` are **stable** in material3 1.3.0+ (included in BOM 2026.03.00).

---

## 4. HSB Color Picker Wheel

**There is NO Material 3 or Accompanist component for an HSB color wheel.** Accompanist's color picker was deprecated and removed. A custom `Canvas`-based implementation is required.

**Recommended approach:**
```kotlin
@Composable
fun ColorWheelPicker(
    hue: Float,
    saturation: Float,
    onColorSelected: (hue: Float, saturation: Float) -> Unit
) {
    Canvas(
        modifier = Modifier
            .size(240.dp)
            .pointerInput(Unit) {
                detectTapGestures { offset ->
                    // Convert offset to polar coordinates -> hue/saturation
                    val center = Offset(size.width / 2f, size.height / 2f)
                    val dx = offset.x - center.x
                    val dy = offset.y - center.y
                    val radius = sqrt(dx * dx + dy * dy)
                    val maxRadius = size.width / 2f
                    if (radius <= maxRadius) {
                        val h = (Math.toDegrees(atan2(dy.toDouble(), dx.toDouble()).toFloat() + PI)).toFloat() % 360f
                        val s = (radius / maxRadius).coerceIn(0f, 1f)
                        onColorSelected(h, s)
                    }
                }
            }
    ) {
        // Draw using SweepGradient + RadialGradient via drawIntoCanvas
        drawIntoCanvas { canvas ->
            val paint = Paint().apply {
                shader = SweepGradient(
                    size.width / 2f, size.height / 2f,
                    intArrayOf(
                        android.graphics.Color.RED,
                        android.graphics.Color.YELLOW,
                        android.graphics.Color.GREEN,
                        android.graphics.Color.CYAN,
                        android.graphics.Color.BLUE,
                        android.graphics.Color.MAGENTA,
                        android.graphics.Color.RED
                    ),
                    null
                )
            }
            canvas.drawCircle(
                Offset(size.width / 2f, size.height / 2f),
                size.width / 2f,
                paint
            )
            // Overlay white-to-transparent radial gradient for saturation
            val saturationPaint = Paint().apply {
                shader = RadialGradient(
                    size.width / 2f, size.height / 2f,
                    size.width / 2f,
                    android.graphics.Color.WHITE, android.graphics.Color.TRANSPARENT,
                    android.graphics.Shader.TileMode.CLAMP
                )
            }
            canvas.drawCircle(
                Offset(size.width / 2f, size.height / 2f),
                size.width / 2f,
                saturationPaint
            )
        }
    }
}
```

---

## 5. Gotchas and Breaking Changes

- **Icons** in `material-icons-extended` use `Icons.Default.*` or `Icons.Filled.*` — many icons moved between versions. Use `Icons.AutoMirrored.*` for LTR/RTL variants.
- **PullRefreshIndicator** from Accompanist is deprecated; use `PullToRefreshContainer` from `androidx.compose.material3` (stable in material3 1.3.0+, available in BOM 2026.03.00).
- **Do not mix** `material` (M2) and `material3` (M3) components in the same screen — they have separate theme systems.
- **`innerPadding`** from `Scaffold` MUST be applied to the content composable to avoid overlap with bars.

---

## Summary

Use BOM `2026.03.00`. All Material 3 components needed for this project (Card, Chip variants, LazyVerticalGrid, ModalNavigationDrawer, NavigationBar, Scaffold, AlertDialog, Slider, SegmentedButton) are **stable** in `material3:1.4.0`. Color picker requires a custom Canvas implementation.
