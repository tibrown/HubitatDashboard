package com.timshubet.hubitatdashboard.ui.shell

object NavRoutes {
    const val SETTINGS = "settings"
    fun group(groupId: String) = "group/$groupId"
    const val GROUP_PATTERN = "group/{groupId}"
    const val DEFAULT_GROUP = "group/environment"
}
