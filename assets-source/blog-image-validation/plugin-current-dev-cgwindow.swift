#!/usr/bin/env swift
import CoreGraphics
import Foundation

guard CommandLine.arguments.count == 2, let expectedPID = Int(CommandLine.arguments[1]) else {
  fputs("usage: plugin-current-dev-cgwindow.swift <pid>\n", stderr)
  exit(64)
}

let options: CGWindowListOption = [.optionOnScreenOnly, .excludeDesktopElements]
guard let rawWindows = CGWindowListCopyWindowInfo(options, kCGNullWindowID) as? [[String: Any]] else {
  fputs("CGWindowListCopyWindowInfo returned no window list.\n", stderr)
  exit(1)
}

let windows: [[String: Any]] = rawWindows.compactMap { raw in
  guard
    let ownerPID = raw[kCGWindowOwnerPID as String] as? Int,
    ownerPID == expectedPID,
    let layer = raw[kCGWindowLayer as String] as? Int,
    layer == 0,
    let bounds = raw[kCGWindowBounds as String] as? [String: Any],
    let x = bounds["X"] as? Double,
    let y = bounds["Y"] as? Double,
    let width = bounds["Width"] as? Double,
    let height = bounds["Height"] as? Double,
    width > 100,
    height > 100
  else { return nil }

  return [
    "windowNumber": raw[kCGWindowNumber as String] as? Int ?? -1,
    "ownerPID": ownerPID,
    "ownerName": raw[kCGWindowOwnerName as String] as? String ?? "",
    "windowName": raw[kCGWindowName as String] as? String ?? "",
    "layer": layer,
    "alpha": raw[kCGWindowAlpha as String] as? Double ?? 0,
    "onScreen": raw[kCGWindowIsOnscreen as String] as? Bool ?? false,
    "sharingState": raw[kCGWindowSharingState as String] as? Int ?? -1,
    "bounds": ["x": x, "y": y, "width": width, "height": height]
  ]
}

let payload: [String: Any] = [
  "queriedPID": expectedPID,
  "capturedAt": ISO8601DateFormatter().string(from: Date()),
  "windows": windows
]
let data = try JSONSerialization.data(withJSONObject: payload, options: [.prettyPrinted, .sortedKeys])
FileHandle.standardOutput.write(data)
FileHandle.standardOutput.write(Data("\n".utf8))

if windows.isEmpty { exit(2) }
