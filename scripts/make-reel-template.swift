import Foundation
import AVFoundation
import AppKit
import CoreGraphics
import CoreVideo

let width = 720
let height = 1280
let fps: Int32 = 30
let durationSeconds = 8
let outputURL = URL(fileURLWithPath: CommandLine.arguments.dropFirst().first ?? "/tmp/pastacihani-reel-template.mp4")
let work = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("pastacihani-reel-build-\(UUID().uuidString)", isDirectory: true)
try FileManager.default.createDirectory(at: work, withIntermediateDirectories: true)
defer { try? FileManager.default.removeItem(at: work) }

let silentURL = work.appendingPathComponent("visual.mp4")
let audioURL = work.appendingPathComponent("music.wav")
try? FileManager.default.removeItem(at: outputURL)

func drawFrame(_ context: CGContext, frame: Int) {
    let t = Double(frame) / Double(fps)
    let rect = CGRect(x: 0, y: 0, width: width, height: height)
    let colors = [
        NSColor(calibratedRed: 0.11, green: 0.055, blue: 0.07, alpha: 1).cgColor,
        NSColor(calibratedRed: 0.34, green: 0.12, blue: 0.20, alpha: 1).cgColor,
        NSColor(calibratedRed: 0.10, green: 0.045, blue: 0.06, alpha: 1).cgColor
    ] as CFArray
    let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: [0, 0.52, 1])!
    context.drawLinearGradient(gradient, start: .zero, end: CGPoint(x: width, y: height), options: [])

    // Yumuşak, yavaş hareket eden ışık halkaları.
    for i in 0..<12 {
        let phase = t * (0.22 + Double(i % 4) * 0.035) + Double(i) * 0.71
        let x = CGFloat((sin(phase) * 0.5 + 0.5) * 820.0 - 50.0)
        let y = CGFloat((cos(phase * 0.83) * 0.5 + 0.5) * 1380.0 - 50.0)
        let radius = CGFloat(34 + (i % 5) * 13)
        context.setFillColor(NSColor(calibratedRed: 0.76, green: 0.58, blue: 0.32, alpha: 0.045).cgColor)
        context.fillEllipse(in: CGRect(x: x - radius, y: y - radius, width: radius * 2, height: radius * 2))
    }

    // Fotoğrafın geleceği premium çerçeve ve gölge.
    let card = CGRect(x: 43, y: 278, width: 634, height: 754)
    context.saveGState()
    context.setShadow(offset: CGSize(width: 0, height: -18), blur: 28, color: NSColor.black.withAlphaComponent(0.40).cgColor)
    context.setFillColor(NSColor(calibratedWhite: 1, alpha: 0.10).cgColor)
    context.addPath(CGPath(roundedRect: card, cornerWidth: 38, cornerHeight: 38, transform: nil))
    context.fillPath()
    context.restoreGState()
    context.setStrokeColor(NSColor(calibratedRed: 0.86, green: 0.72, blue: 0.48, alpha: 0.42).cgColor)
    context.setLineWidth(2)
    context.addPath(CGPath(roundedRect: card, cornerWidth: 38, cornerHeight: 38, transform: nil))
    context.strokePath()

    // Üst ve alt marka şeritleri; asıl logo Cloudinary katmanı olarak eklenir.
    context.setTextDrawingMode(.fill)
    let paragraph = NSMutableParagraphStyle()
    paragraph.alignment = .center
    let gold = NSColor(calibratedRed: 0.91, green: 0.78, blue: 0.54, alpha: 1)
    let white = NSColor(calibratedWhite: 1, alpha: 0.96)
    let title = NSAttributedString(string: "PASTACİHANI", attributes: [
        .font: NSFont.systemFont(ofSize: 34, weight: .semibold), .foregroundColor: gold,
        .kern: 7.0, .paragraphStyle: paragraph
    ])
    let subtitle = NSAttributedString(string: "Hayalindeki pasta, gerçeğe dönüşür.", attributes: [
        .font: NSFont.systemFont(ofSize: 25, weight: .medium), .foregroundColor: white,
        .paragraphStyle: paragraph
    ])
    let footer = NSAttributedString(string: "Silivri  ·  0554 810 63 01", attributes: [
        .font: NSFont.systemFont(ofSize: 22, weight: .medium), .foregroundColor: gold,
        .kern: 1.4, .paragraphStyle: paragraph
    ])
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: false)
    title.draw(in: CGRect(x: 50, y: 1110, width: 620, height: 48))
    subtitle.draw(in: CGRect(x: 50, y: 175, width: 620, height: 40))
    footer.draw(in: CGRect(x: 50, y: 125, width: 620, height: 35))
    NSGraphicsContext.restoreGraphicsState()

    // İnce, dönen parıltı çizgisi.
    let shimmer = CGFloat((t.truncatingRemainder(dividingBy: 2.4)) / 2.4)
    context.setStrokeColor(NSColor.white.withAlphaComponent(0.10).cgColor)
    context.setLineWidth(3)
    context.move(to: CGPoint(x: -160 + shimmer * 1040, y: 250))
    context.addLine(to: CGPoint(x: 60 + shimmer * 1040, y: 1060))
    context.strokePath()
    context.setFillColor(NSColor.clear.cgColor)
    context.fill(rect)
}

func makeSilentVideo() throws {
    let writer = try AVAssetWriter(outputURL: silentURL, fileType: .mp4)
    let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
        AVVideoCodecKey: AVVideoCodecType.h264,
        AVVideoWidthKey: width,
        AVVideoHeightKey: height,
        AVVideoCompressionPropertiesKey: [
            AVVideoAverageBitRateKey: 2_500_000,
            AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
            AVVideoMaxKeyFrameIntervalKey: Int(fps)
        ]
    ])
    input.expectsMediaDataInRealTime = false
    let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
        kCVPixelBufferWidthKey as String: width,
        kCVPixelBufferHeightKey as String: height
    ])
    guard writer.canAdd(input) else { throw NSError(domain: "Pastacihani", code: 1) }
    writer.add(input)
    writer.startWriting()
    writer.startSession(atSourceTime: .zero)

    for frame in 0..<(durationSeconds * Int(fps)) {
        while !input.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.002) }
        guard let pool = adaptor.pixelBufferPool else { throw NSError(domain: "Pastacihani", code: 2) }
        var maybeBuffer: CVPixelBuffer?
        CVPixelBufferPoolCreatePixelBuffer(nil, pool, &maybeBuffer)
        guard let buffer = maybeBuffer else { throw NSError(domain: "Pastacihani", code: 3) }
        CVPixelBufferLockBaseAddress(buffer, [])
        let context = CGContext(
            data: CVPixelBufferGetBaseAddress(buffer), width: width, height: height,
            bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue
        )!
        drawFrame(context, frame: frame)
        CVPixelBufferUnlockBaseAddress(buffer, [])
        adaptor.append(buffer, withPresentationTime: CMTime(value: Int64(frame), timescale: fps))
    }
    input.markAsFinished()
    let semaphore = DispatchSemaphore(value: 0)
    writer.finishWriting { semaphore.signal() }
    semaphore.wait()
    if writer.status != .completed { throw writer.error ?? NSError(domain: "Pastacihani", code: 4) }
}

func makeOriginalMusic() throws {
    let sampleRate = 44_100.0
    let format = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 2)!
    let frames = AVAudioFrameCount(sampleRate * Double(durationSeconds))
    let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frames)!
    buffer.frameLength = frames
    let notes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 293.66, 392.00]
    for channel in 0..<2 {
        let data = buffer.floatChannelData![channel]
        for i in 0..<Int(frames) {
            let t = Double(i) / sampleRate
            let beat = Int(t / 0.5) % notes.count
            let local = t.truncatingRemainder(dividingBy: 0.5)
            let env = min(local / 0.025, 1.0) * exp(-local * 3.8)
            let f = notes[beat]
            let bell = sin(2 * .pi * f * t) + 0.34 * sin(2 * .pi * f * 2.01 * t)
            let pad = sin(2 * .pi * (channel == 0 ? 130.81 : 196.0) * t) * 0.18
            let fade = min(min(t / 0.65, (Double(durationSeconds) - t) / 0.75), 1.0)
            data[i] = Float((bell * env * 0.085 + pad * 0.035) * max(0, fade))
        }
    }
    let file = try AVAudioFile(forWriting: audioURL, settings: format.settings)
    try file.write(from: buffer)
}

func mux() throws {
    let composition = AVMutableComposition()
    let videoAsset = AVURLAsset(url: silentURL)
    let audioAsset = AVURLAsset(url: audioURL)
    guard let sourceVideo = videoAsset.tracks(withMediaType: .video).first,
          let sourceAudio = audioAsset.tracks(withMediaType: .audio).first,
          let videoTrack = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid),
          let audioTrack = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)
    else { throw NSError(domain: "Pastacihani", code: 5) }
    let range = CMTimeRange(start: .zero, duration: CMTime(seconds: Double(durationSeconds), preferredTimescale: 600))
    try videoTrack.insertTimeRange(range, of: sourceVideo, at: .zero)
    try audioTrack.insertTimeRange(range, of: sourceAudio, at: .zero)
    videoTrack.preferredTransform = sourceVideo.preferredTransform
    guard let exporter = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetHighestQuality) else {
        throw NSError(domain: "Pastacihani", code: 6)
    }
    exporter.outputURL = outputURL
    exporter.outputFileType = .mp4
    exporter.shouldOptimizeForNetworkUse = true
    let semaphore = DispatchSemaphore(value: 0)
    exporter.exportAsynchronously { semaphore.signal() }
    semaphore.wait()
    if exporter.status != .completed { throw exporter.error ?? NSError(domain: "Pastacihani", code: 7) }
}

try makeSilentVideo()
try makeOriginalMusic()
try mux()
print(outputURL.path)
