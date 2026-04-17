# Research Request: Jetpack Compose BOM + Material Design 3

Requested by: architect, frontend-dev
For tasks: 17001, 17006, 17007, 17008, 17009, 17010, 17011, 17012, 17013, 17014

Questions:
- What is the latest stable Jetpack Compose BOM version and how is it declared in app/build.gradle.kts?
- What are the exact Maven coordinates and versions for androidx.compose.ui, androidx.compose.material3, and androidx.compose.material:material-icons-extended?
- How do you declare a Material3 Card composable with click handling and loading state overlay?
- What is the correct API for Material3 Chip variants: AssistChip, FilterChip, SuggestionChip — including icon slot and color customization?
- How do you implement a LazyVerticalGrid with a fixed 2-column layout and per-item aspect ratio in Compose?
- What is the full setup for ModalNavigationDrawer with DrawerState and a Scaffold: correct parameter order, scrim behavior, gesture handling?
- How do you implement a BottomNavigationBar (NavigationBar + NavigationBarItem) with selected state driven by NavController's current backstack entry?
- How is Scaffold used in Material3: topBar, bottomBar, snackbarHost, and content padding slots?
- What is the API for Material3 AlertDialog with confirm/dismiss buttons and a custom content slot?
- How do you implement a Slider in Material3 Compose: value range, steps, onValueChangeFinished vs onValueChange?
- Is SegmentedButton (SingleChoiceSegmentedButtonRow) stable in material3 as of the latest BOM, and what is its API?
- What is the recommended approach for a full HSB color picker wheel in Compose — is there a Material3 or Accompanist component, or must it be custom Canvas?
