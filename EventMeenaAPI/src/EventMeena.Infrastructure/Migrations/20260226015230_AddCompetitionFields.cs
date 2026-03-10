using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventMeena.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCompetitionFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // إضافة حقول المسابقة الجديدة إلى جدول Events
            migrationBuilder.AddColumn<string>(
                name: "CompetitionMode",
                table: "Events",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "DrawCompleted",
                table: "Events",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "QualifyingScore",
                table: "Events",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WinnersCount",
                table: "Events",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<string>(
                name: "WinnersJson",
                table: "Events",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "CompetitionMode", table: "Events");
            migrationBuilder.DropColumn(name: "DrawCompleted", table: "Events");
            migrationBuilder.DropColumn(name: "QualifyingScore", table: "Events");
            migrationBuilder.DropColumn(name: "WinnersCount", table: "Events");
            migrationBuilder.DropColumn(name: "WinnersJson", table: "Events");
        }
    }
}
