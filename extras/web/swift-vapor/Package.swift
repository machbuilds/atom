// swift-tools-version:5.10
import PackageDescription

let package = Package(
    name: "App",
    platforms: [
        .macOS(.v13),
    ],
    dependencies: [
        .package(url: "https://github.com/vapor/vapor.git", from: "4.99.0"),
    ],
    targets: [
        .executableTarget(
            name: "App",
            dependencies: [
                .product(name: "Vapor", package: "vapor"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("DisableOutwardActorInference"),
                .enableExperimentalFeature("StrictConcurrency"),
            ]
        ),
    ]
)
