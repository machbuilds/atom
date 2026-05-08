// app — CLI entry point.
//
// Build:    go build -o app .
// Run:      go run . [command]
// Release:  goreleaser release --clean (see .goreleaser.yaml)
package main

import (
	"fmt"
	"os"

	"app/cmd"
)

// version is overridden at link time via -ldflags by GoReleaser.
var version = "dev"

func main() {
	cmd.SetVersion(version)
	if err := cmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
