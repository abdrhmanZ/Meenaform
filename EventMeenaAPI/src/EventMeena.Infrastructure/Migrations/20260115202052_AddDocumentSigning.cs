using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventMeena.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentSigning : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AllowDownloadAfterSigning",
                table: "Events",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "DocumentFileName",
                table: "Events",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocumentUrl",
                table: "Events",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "SendCopyToSigner",
                table: "Events",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "SignatureFields",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    PageNumber = table.Column<int>(type: "int", nullable: false),
                    PositionX = table.Column<double>(type: "float", nullable: false),
                    PositionY = table.Column<double>(type: "float", nullable: false),
                    Width = table.Column<double>(type: "float", nullable: false),
                    Height = table.Column<double>(type: "float", nullable: false),
                    IsRequired = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    Order = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    FieldType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "signature"),
                    IncludeDate = table.Column<bool>(type: "bit", nullable: false),
                    IncludeName = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SignatureFields", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SignatureFields_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DocumentSignatures",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SignatureFieldId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ResponseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SignerName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    SignerEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    SignerPhone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    SignatureData = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SignedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IpAddress = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    UserAgent = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentSignatures", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentSignatures_Responses_ResponseId",
                        column: x => x.ResponseId,
                        principalTable: "Responses",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_DocumentSignatures_SignatureFields_SignatureFieldId",
                        column: x => x.SignatureFieldId,
                        principalTable: "SignatureFields",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentSignatures_ResponseId",
                table: "DocumentSignatures",
                column: "ResponseId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentSignatures_SignatureFieldId",
                table: "DocumentSignatures",
                column: "SignatureFieldId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentSignatures_SignerEmail",
                table: "DocumentSignatures",
                column: "SignerEmail");

            migrationBuilder.CreateIndex(
                name: "IX_SignatureFields_EventId",
                table: "SignatureFields",
                column: "EventId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DocumentSignatures");

            migrationBuilder.DropTable(
                name: "SignatureFields");

            migrationBuilder.DropColumn(
                name: "AllowDownloadAfterSigning",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "DocumentFileName",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "DocumentUrl",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "SendCopyToSigner",
                table: "Events");
        }
    }
}
