@rem Gradle startup script for Windows
@echo off
set JAVA_OPTS=
set GRADLE_OPTS=
java -jar "%~dp0gradle\wrapper\gradle-wrapper.jar" %*
