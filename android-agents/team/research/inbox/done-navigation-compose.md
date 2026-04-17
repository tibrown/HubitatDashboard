# Research Request: Navigation Compose

Requested by: frontend-dev
For tasks: 17007

Questions:
- What is the latest stable Maven coordinate for androidx.navigation:navigation-compose?
- How do you create a NavHost with a NavController and define composable() routes with string or typed route keys?
- How do you navigate between routes using navController.navigate() and handle back-stack correctly (popUpTo, launchSingleTop)?
- What is the recommended pattern for integrating BottomNavigationBar with NavController so tapping a tab navigates to the correct route and highlights the selected item?
- How do you integrate ModalNavigationDrawer with NavController so the drawer closes after navigation?
- How do you pass arguments to a destination composable (e.g., groupId: String) — using route path params vs SavedStateHandle?
- What is the correct way to get the current NavBackStackEntry's route to drive selected state in BottomNavigationBar?
- How do you handle the case where the app must redirect to a Settings route on first launch (no hub configured)?
