# Research Request: Jetpack DataStore Preferences + EncryptedSharedPreferences

Requested by: api-dev, frontend-dev
For tasks: 17003, 17006, 17014

Questions:
- What are the latest stable Maven coordinates for androidx.datastore:datastore-preferences and androidx.security:security-crypto?
- How do you create a DataStore<Preferences> instance as a singleton in a Hilt @Module using the preferencesDataStore delegate?
- What is the correct API to read a typed preference value (e.g., stringPreferencesKey, booleanPreferencesKey) as a Flow<T> with a default value?
- How do you write/update a preference value using dataStore.edit { }?
- How do you create an EncryptedSharedPreferences instance using MasterKey backed by Android Keystore — what is the correct MasterKey.Builder and EncryptedSharedPreferences.create() call?
- What is the minimum supported API level for EncryptedSharedPreferences and are there any known issues with API 26?
- How do you store and retrieve a sensitive String (e.g., access token) using EncryptedSharedPreferences?
- Can DataStore and EncryptedSharedPreferences coexist in the same app — recommended split: what goes in each?
- How do you persist a user's dark/light theme override in DataStore and observe it in a Compose ViewModel?
