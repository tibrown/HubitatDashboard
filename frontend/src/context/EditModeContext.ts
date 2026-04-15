import { createContext, useContext } from 'react'

/** True while a group page has edit mode active. Tiles use this to force-expand. */
export const EditModeContext = createContext(false)
export const useEditMode = () => useContext(EditModeContext)
