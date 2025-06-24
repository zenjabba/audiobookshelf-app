//
//  LocalMediaProgress.swift
//  App
//
//  Created by Ron Heft on 8/16/22.
//

import Foundation
import RealmSwift

class LocalMediaProgress: Object, Codable {
    @Persisted(primaryKey: true) var id: String = ""
    @Persisted(indexed: true) var localLibraryItemId: String = ""
    @Persisted(indexed: true) var localEpisodeId: String?
    @Persisted var duration: Double = 0
    @Persisted var progress: Double = 0
    @Persisted var currentTime: Double = 0
    @Persisted var isFinished: Bool = false
    @Persisted var ebookLocation: String?
    @Persisted var ebookProgress: Double?
    @Persisted var lastUpdate: Double = 0
    @Persisted var startedAt: Double = 0
    @Persisted var finishedAt: Double?
    // For local lib items from server to support server sync
    @Persisted var serverConnectionConfigId: String?
    @Persisted var serverAddress: String?
    @Persisted var serverUserId: String?
    @Persisted(indexed: true) var libraryItemId: String?
    @Persisted(indexed: true) var episodeId: String?

    var progressPercent: Int { Int(self.progress * 100) }
    
    private enum CodingKeys : String, CodingKey {
        case id, localLibraryItemId, localEpisodeId, duration, progress, currentTime, isFinished, ebookLocation, ebookProgress, lastUpdate, startedAt, finishedAt, serverConnectionConfigId, serverAddress, serverUserId, libraryItemId, episodeId
    }
    
    override init() {
        super.init()
    }
    
    required init(from decoder: Decoder) throws {
        super.init()

        let values = try decoder.container(keyedBy: CodingKeys.self)
        id = try values.decode(String.self, forKey: .id)
        localLibraryItemId = try values.decode(String.self, forKey: .localLibraryItemId)
        localEpisodeId = try values.decodeIfPresent(String.self, forKey: .localEpisodeId)
        duration = try values.decode(Double.self, forKey: .duration)
        progress = try values.decode(Double.self, forKey: .progress)
        currentTime = try values.decode(Double.self, forKey: .currentTime)
        isFinished = try values.decode(Bool.self, forKey: .isFinished)
        ebookLocation = try values.decodeIfPresent(String.self, forKey: .ebookLocation)
        ebookProgress = try values.doubleOrStringDecoder(key: .ebookProgress)
        lastUpdate = try values.decode(Double.self, forKey: .lastUpdate)
        startedAt = try values.decode(Double.self, forKey: .startedAt)
        finishedAt = try values.decodeIfPresent(Double.self, forKey: .finishedAt)
        serverConnectionConfigId = try values.decodeIfPresent(String.self, forKey: .serverConnectionConfigId)
        serverAddress = try values.decodeIfPresent(String.self, forKey: .serverAddress)
        serverUserId = try values.decodeIfPresent(String.self, forKey: .serverUserId)
        libraryItemId = try values.decodeIfPresent(String.self, forKey: .libraryItemId)
        episodeId = try values.decodeIfPresent(String.self, forKey: .episodeId)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(localLibraryItemId, forKey: .localLibraryItemId)
        try container.encode(localEpisodeId, forKey: .localEpisodeId)
        try container.encode(duration, forKey: .duration)
        if progress.isNaN == false {
            try container.encode(progress, forKey: .progress)
        }
        if currentTime.isNaN == false {
            try container.encode(currentTime, forKey: .currentTime)
        }
        try container.encode(isFinished, forKey: .isFinished)
        try container.encode(ebookLocation, forKey: .ebookLocation)
        try container.encode(ebookProgress, forKey: .ebookProgress)
        try container.encode(lastUpdate, forKey: .lastUpdate)
        try container.encode(startedAt, forKey: .startedAt)
        try container.encode(finishedAt, forKey: .finishedAt)
        try container.encode(serverConnectionConfigId, forKey: .serverConnectionConfigId)
        try container.encode(serverAddress, forKey: .serverAddress)
        try container.encode(serverUserId, forKey: .serverUserId)
        try container.encode(libraryItemId, forKey: .libraryItemId)
        try container.encode(episodeId, forKey: .episodeId)
    }
}

extension LocalMediaProgress {
    convenience init(localLibraryItem: LocalLibraryItem, episode: PodcastEpisode?) {
        self.init()
        
        self.id = localLibraryItem.id
        self.localLibraryItemId = localLibraryItem.id
        self.libraryItemId = localLibraryItem.libraryItemId
        
        self.serverAddress = localLibraryItem.serverAddress
        self.serverUserId = localLibraryItem.serverUserId
        self.serverConnectionConfigId = localLibraryItem.serverConnectionConfigId
        
        self.duration = localLibraryItem.getDuration()
        self.progress = 0.0
        self.currentTime = 0.0
        self.isFinished = false
        self.ebookProgress = 0.0
        self.lastUpdate = Date().timeIntervalSince1970 * 1000
        self.startedAt = 0
        self.finishedAt = nil
        
        if let episode = episode {
            self.id += "-\(episode.id)"
            self.episodeId = episode.id
            self.localEpisodeId = episode.id
            self.duration = episode.duration ?? 0.0
        }
    }
    
    convenience init(localLibraryItem: LocalLibraryItem, episode: PodcastEpisode?, progress: MediaProgress) {
        self.init(localLibraryItem: localLibraryItem, episode: episode)
        self.duration = progress.duration
        self.progress = progress.progress
        self.currentTime = progress.currentTime
        self.isFinished = progress.isFinished
        self.ebookLocation = progress.ebookLocation
        self.ebookProgress = progress.ebookProgress
        self.lastUpdate = progress.lastUpdate
        self.startedAt = progress.startedAt
        self.finishedAt = progress.finishedAt
    }
    
    func updateIsFinished(_ finished: Bool) throws {
        try self.realm?.write {
            if self.isFinished != finished {
                self.progress = finished ? 1.0 : 0.0
            }
            
            if finished {
                self.currentTime = 0.0
            }

            if self.startedAt == 0 && finished {
                self.startedAt = Date().timeIntervalSince1970 * 1000
            }
            
            self.isFinished = finished
            self.lastUpdate = Date().timeIntervalSince1970 * 1000
            self.finishedAt = finished ? lastUpdate : nil
        }
    }
    
    func updateFromPlaybackSession(_ playbackSession: PlaybackSession) throws {
        try self.realm?.write {
            self.currentTime = playbackSession.currentTime
            self.progress = playbackSession.progress
            self.lastUpdate = Date().timeIntervalSince1970 * 1000
            self.isFinished = playbackSession.progress >= 0.99
            self.finishedAt = self.isFinished ? self.lastUpdate : nil
            
            // Update duration if not set or if it changed
            if self.duration == 0 || self.duration != playbackSession.duration {
                self.duration = playbackSession.duration
            }
            
            // Set startedAt if this is the first time we're saving progress
            if self.startedAt == 0 && playbackSession.currentTime > 0 {
                self.startedAt = self.lastUpdate
            }
        }
    }
    
    func updateFromServerMediaProgress(_ serverMediaProgress: MediaProgress) throws {
        try self.realm?.write {
            self.isFinished = serverMediaProgress.isFinished
            self.ebookLocation = serverMediaProgress.ebookLocation
            self.ebookProgress = serverMediaProgress.ebookProgress
            self.progress = serverMediaProgress.progress
            self.currentTime = serverMediaProgress.currentTime
            self.duration = serverMediaProgress.duration
            self.lastUpdate = serverMediaProgress.lastUpdate
            self.finishedAt = serverMediaProgress.finishedAt
            self.startedAt = serverMediaProgress.startedAt
        }
    }
    
    func updateEbookProgress(ebookLocation:String, ebookProgress:Double) throws {
        try self.realm?.write {
            self.ebookLocation = ebookLocation
            self.ebookProgress = ebookProgress
            self.lastUpdate = Date().timeIntervalSince1970 * 1000
        }
    }
    
    static func getLocalMediaProgressId(localLibraryItemId: String?, localEpisodeId: String?) -> String? {
        if let itemId = localLibraryItemId, let episodeId = localEpisodeId {
            return "\(itemId)-\(episodeId)"
        } else if let itemId = localLibraryItemId {
            return itemId
        } else {
            return nil
        }
    }
    
    static func fetchOrCreateLocalMediaProgress(localMediaProgressId: String?, localLibraryItemId: String?, localEpisodeId: String?) throws -> LocalMediaProgress? {
        let localMediaProgressId = localMediaProgressId != nil ? localMediaProgressId : LocalMediaProgress.getLocalMediaProgressId(localLibraryItemId: localLibraryItemId, localEpisodeId: localEpisodeId)
        
        let realm = try Realm()
        return try realm.write { () -> LocalMediaProgress? in
            if let localMediaProgressId = localMediaProgressId {
                // Check if it existing in the database, if not, we need to create it
                if let progress = Database.shared.getLocalMediaProgress(localMediaProgressId: localMediaProgressId) {
                    return progress
                }
            }
            
            if let localLibraryItemId = localLibraryItemId {
                guard let localLibraryItem = Database.shared.getLocalLibraryItem(localLibraryItemId: localLibraryItemId) else { return nil }
                let episode = localLibraryItem.getPodcastEpisode(episodeId: localEpisodeId)
                let progress = LocalMediaProgress(localLibraryItem: localLibraryItem, episode: episode)
                realm.add(progress)
                return progress
            } else {
                return nil
            }
        }
    }
}

