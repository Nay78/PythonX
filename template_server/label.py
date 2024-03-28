

import zipfile
import io
from datetime import datetime, timedelta
import os
import subprocess
import time


def edit_zip_file(input_path, target_file_name, edit_function, output_path='edited_archive.zip'):
    # Open the existing zip file
    with zipfile.ZipFile(input_path, 'r') as zip_in:
        # Create an in-memory buffer to hold the modified contents
        buffer = io.BytesIO()
        
        # Create a new zip file for writing
        with zipfile.ZipFile(buffer, 'a', zipfile.ZIP_DEFLATED, False) as zip_out:
            # Iterate through each file in the existing zip file
            for file_info in zip_in.infolist():
                # Extract the file content
                content = zip_in.read(file_info.filename)
                
                # Check if this is the target file
                if file_info.filename == target_file_name:
                    # Perform the operation on the file content
                    edited_content = edit_function(content)
                    # Write the edited content to the new zip file
                    zip_out.writestr(file_info.filename, edited_content)
                else:
                    # Write the unchanged content to the new zip file
                    zip_out.writestr(file_info.filename, content)
        
        # Move to the beginning of the buffer
        buffer.seek(0)
        
        # Write the buffer content to a new zip file
        with open(output_path, 'wb') as edited_file:
            edited_file.write(buffer.read())
            

def replace_text(content, **replacements):
    for key, value in replacements.items():
        content = content.replace(key.encode(), value.encode())
    return content

def replace_text_in_file(input_path, target_file_name, replacements, output_path='edited_archive.zip'):
    replace_text_func = lambda content: replace_text(content, **replacements)
    return edit_zip_file(input_path, target_file_name, replace_text_func, output_path)

# convert .odt file to png using command line
# run in command line: soffice --headless --convert-to png template_test1.odt
def convert_odt_to_png(input_path, output_path):
    subprocess.run(['soffice', '--headless', '--convert-to', 'png', input_path, '--outdir', output_path])

def today(offset=0): 
    return (datetime.today() + timedelta(days=offset)).strftime("%Y-%m-%d")

def print_today_label(path=None, n=1, wait=2, brother_ql_path="brother_ql", printer_ip="192.168.1.210:9100"):
    path = path or os.path.join(os.path.expanduser("~"), "Templates", "Output", f"{today()}.png")
    command = f"{brother_ql_path} --backend network --model QL-810W --printer tcp://{printer_ip} print --label 62 -d {path}"
    command = command.split()
    for _ in range(n):
        subprocess.run(command)
        time.sleep(wait)

def create_label(filename="AVE MAYO.odt", folder=None, date_offset=0):
    folder = folder or os.path.join(os.path.expanduser("~"), "Templates")
    output_filename = f"{today()}.odt"
    output_png_folder = os.path.join(folder, "Output")
    output_png_path = os.path.join(output_png_folder, f"{today()}.png")
    input_path = os.path.join(folder, filename)
    output_path = os.path.join(folder, output_filename)
    
    if not os.path.exists(input_path):
        raise FileNotFoundError(input_path)

    replace_text_in_file(input_path, 'content.xml', 
                         {'{elaboracion}': today(date_offset), 
                          '{vencimiento}': today(2 + date_offset)}, output_filename)
    convert_odt_to_png(output_filename, output_png_folder)
    # print_today_label(output_png_path)
    os.remove(output_filename)


if __name__ == "__main__":
    # commmand line interface
    import argparse
    parser = argparse.ArgumentParser(description='Create a label.')
    subparsers = parser.add_subparsers(dest="command", help='sub-command help')

    create_label_parser = subparsers.add_parser('create', help='Create a label.')
    create_label_parser.add_argument('filename', type=str, help='The name of the file to use as a template.')
    create_label_parser.add_argument('--folder', type=str, default=os.path.join(os.path.expanduser("~"), "Templates"), help='The folder where the template is located.')
    create_label_parser.add_argument('--date-offset', type=int, default=0, help='Today is the default, offset.')

    print_label_parser = subparsers.add_parser('print', help='Create a label.')
    print_label_parser.add_argument('--path', type=str, default=os.path.join(os.path.expanduser("~"), "Templates", "Output", f"{today()}.png"), help='path')
    print_label_parser.add_argument('--qty', type=str, default=1, help='path')
    print_label_parser.add_argument('--wait', type=str, default=2, help='path')
    print_label_parser.add_argument('--brother_ql_path', default="brother_ql", type=str, help='path')
    print_label_parser.add_argument('--printer_ip', default="192.168.1.210:9100", type=str, help='path')

    args = parser.parse_args()
    if args.command == "create":
        print("Creating label from template", args.filename, "in folder", args.folder, "with date", today(args.date_offset))    
        create_label(args.filename, args.folder, date_offset=args.date_offset)
    elif args.command == "print":
        print("Printing label from path", args.path)
        print_today_label(args.path, qty=int(args.qty), wait=float(args.wait), brother_ql_path=args.brother_ql_path, printer_ip=args.printer_ip)
