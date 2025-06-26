//
//  PlayerEvents.swift
//  App
//
//  Created by Rasmus Krämer on 14.04.22.
//

import Foundation

enum PlayerEvents: String {
    case update = "com.datahorders.app.player.update"
    case closed = "com.datahorders.app.player.closed"
    case sleepSet = "com.datahorders.app.player.sleep.set"
    case sleepEnded = "com.datahorders.app.player.sleep.ended"
    case failed = "com.datahorders.app.player.failed"
    case localProgress = "com.datahorders.app.player.localProgress"
}
